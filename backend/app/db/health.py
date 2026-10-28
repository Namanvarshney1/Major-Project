"""
PrepPulse MongoDB Connectivity & Health Check Utility
Provides reusable database connection diagnostics, ping verification,
and error root-cause analysis without leaking credentials.
"""
import sys
import asyncio
from typing import Optional, Dict, Any
from urllib.parse import urlsplit, urlunsplit

import motor.motor_asyncio
from pymongo.errors import (
    ConnectionFailure,
    ServerSelectionTimeoutError,
    OperationFailure,
    ConfigurationError,
)

from app.core.config import settings
from app.core.logging import logger


def mask_mongo_uri(uri: str) -> str:
    """
    Safely masks username:password credentials in a MongoDB URI string.
    Ensures passwords and secrets are never printed to logs or standard output.
    """
    if not uri:
        return "<empty>"
    try:
        parts = urlsplit(uri)
        if parts.password:
            masked_netloc = f"{parts.username}:****@{parts.hostname or ''}"
            if parts.port:
                masked_netloc += f":{parts.port}"
            return urlunsplit((parts.scheme, masked_netloc, parts.path, parts.query, parts.fragment))
        return uri
    except Exception:
        # Fallback in case of non-standard URI syntax
        if "@" in uri:
            prefix, rest = uri.split("@", 1)
            scheme_and_auth = prefix.split("://", 1)
            if len(scheme_and_auth) == 2:
                scheme, auth = scheme_and_auth
                user = auth.split(":", 1)[0] if ":" in auth else "user"
                return f"{scheme}://{user}:****@{rest}"
        return "<masked_uri>"


def is_atlas_uri(uri: str) -> bool:
    """Determines whether the provided URI points to a MongoDB Atlas cluster."""
    if not uri:
        return False
    uri_lower = uri.lower()
    return uri_lower.startswith("mongodb+srv://") or ".mongodb.net" in uri_lower


async def check_mongodb_connection(
    uri: Optional[str] = None,
    database_name: Optional[str] = None,
    timeout_ms: int = 3000
) -> Dict[str, Any]:
    """
    Performs a non-destructive ping command against the target MongoDB instance.
    Does NOT modify, create, or delete any database records.
    
    Returns a dictionary containing connectivity status, ping response,
    selected database, masked URI, and actionable diagnostics if failed.
    """
    target_uri = uri or settings.MONGODB_URI
    target_db_name = database_name or settings.MONGODB_DATABASE
    masked_uri = mask_mongo_uri(target_uri)
    is_atlas = is_atlas_uri(target_uri)

    result: Dict[str, Any] = {
        "success": False,
        "database_name": target_db_name,
        "target_uri_masked": masked_uri,
        "is_atlas": is_atlas,
        "ping_result": None,
        "error_type": None,
        "error_message": None,
        "cause": None,
        "fix_instructions": None,
    }

    client = None
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(
            target_uri,
            serverSelectionTimeoutMS=timeout_ms,
            connectTimeoutMS=timeout_ms,
            socketTimeoutMS=timeout_ms,
            uuidRepresentation="standard"
        )

        # Issue non-destructive ping command to verify active database server connectivity
        ping_res = await client.admin.command("ping")
        result["success"] = True
        result["ping_result"] = ping_res
        return result

    except OperationFailure as exc:
        result["error_type"] = "OperationFailure"
        result["error_message"] = str(exc)
        exc_str = str(exc).lower()
        if "authentication failed" in exc_str or "bad auth" in exc_str or exc.code in (18, 8000):
            bracket_warning = ""
            if ":<" in target_uri and ">@" in target_uri:
                bracket_warning = (
                    "\n--> CRITICAL FORMATTING NOTE: Your MONGODB_URI contains literal placeholder angle brackets '<' and '>' "
                    "around your password (e.g., :<password>@). The brackets '<' and '>' are placeholders and MUST be removed "
                    "(e.g., :myPassword@)."
                )
            result["cause"] = (
                f"Authentication failed: The username or password provided in MONGODB_URI was rejected by Atlas.{bracket_warning}"
            )
            result["fix_instructions"] = (
                "1. If your password has '<' and '>', remove them so only the raw password remains.\n"
                "2. Double-check your database user credentials in MongoDB Atlas (Database Access -> Database Users).\n"
                "3. Ensure the database user has 'Read and write to any database' role.\n"
                "4. If your password contains special characters, URL-encode them (e.g. '@' -> '%40')."
            )
        else:
            result["cause"] = f"MongoDB operation failed: {exc}"
            result["fix_instructions"] = "Check database user permissions and Atlas cluster roles."

    except ServerSelectionTimeoutError as exc:
        result["error_type"] = "ServerSelectionTimeoutError"
        result["error_message"] = str(exc)
        exc_str = str(exc)
        if "TLSV1_ALERT_INTERNAL_ERROR" in exc_str or "tlsv1 alert internal error" in exc_str:
            result["cause"] = (
                "MongoDB Atlas TLS handshake failed (TLSV1_ALERT_INTERNAL_ERROR).\n"
                "In MongoDB Atlas, this specific error is triggered by the Atlas SNI gateway when the connecting "
                "client's IP address is NOT allowed in the Network Access IP Access List."
            )
            result["fix_instructions"] = (
                "1. Log in to MongoDB Atlas: https://cloud.mongodb.com\n"
                "2. Navigate to 'Network Access' (under Security in the left sidebar of your Atlas Project).\n"
                "3. Click 'Add IP Address'.\n"
                "4. Click 'Add Current IP Address' (or enter '0.0.0.0/0' to allow access from anywhere for development).\n"
                "5. Click 'Confirm' and wait 1-2 minutes for Atlas to deploy the network security rule."
            )
        elif is_atlas:
            result["cause"] = (
                "Could not reach MongoDB Atlas cluster within timeout. Possible causes:\n"
                "1. IP Whitelist: Your current IP address is not allowed in MongoDB Atlas Network Access.\n"
                "2. Network/Firewall: Outbound traffic on port 27017 or DNS SRV lookups are blocked by firewall/VPN.\n"
                "3. Cluster state: The cluster may be paused, terminating, or deleted."
            )
            result["fix_instructions"] = (
                "1. Go to MongoDB Atlas console -> 'Network Access'.\n"
                "2. Add your current IP address or add 0.0.0.0/0 (allow from anywhere) for development.\n"
                "3. Ensure your Atlas cluster is active and not paused."
            )
        else:
            result["cause"] = (
                f"Configured MONGODB_URI is pointing to local instance ({masked_uri}) but no local "
                "MongoDB service is running on this machine (connection refused)."
            )
            result["fix_instructions"] = (
                "To connect to MongoDB Atlas:\n"
                "1. In your backend/.env (and .env) file, set MONGODB_URI to your Atlas connection string:\n"
                "   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority\n"
                "2. Set MONGODB_DATABASE=preppulse_db (or your desired database name).\n"
                "3. If you want to use local MongoDB instead, start the MongoDB service locally (e.g., net start MongoDB)."
            )

    except ConfigurationError as exc:
        result["error_type"] = "ConfigurationError"
        result["error_message"] = str(exc)
        result["cause"] = "Invalid MongoDB connection string or DNS SRV configuration error."
        result["fix_instructions"] = (
            "Ensure the connection string is copied directly from MongoDB Atlas 'Connect' modal "
            "(Drivers -> Python) and starts with 'mongodb+srv://'."
        )

    except ConnectionFailure as exc:
        result["error_type"] = "ConnectionFailure"
        result["error_message"] = str(exc)
        result["cause"] = f"Failed to establish connection to MongoDB: {exc}"
        result["fix_instructions"] = "Check network connectivity and verify the cluster host."

    except Exception as exc:
        result["error_type"] = type(exc).__name__
        result["error_message"] = str(exc)
        result["cause"] = f"Unexpected error during connection test: {exc}"
        result["fix_instructions"] = "Inspect the full stack trace and verify network/library configuration."

    finally:
        if client is not None:
            client.close()

    return result


def print_health_check_report(diag: Dict[str, Any]):
    """Prints a structured, human-readable health check summary without secrets."""
    print("=" * 60)
    print(" PREPPULSE MONGODB ATLAS CONNECTIVITY VERIFICATION REPORT")
    print("=" * 60)
    print(f"Target Database Name : {diag['database_name']}")
    print(f"Configured URI       : {diag['target_uri_masked']}")
    print(f"Cluster Type         : {'MongoDB Atlas (Cloud)' if diag['is_atlas'] else 'Local / On-Premises'}")
    print(f"Connection Status    : {'SUCCESS (CONNECTED)' if diag['success'] else 'FAILED (NOT CONNECTED)'}")

    if diag["success"]:
        print("\n--> MongoDB ping command returned successfully:")
        print(f"    Ping Result: {diag['ping_result']}")
        print("\n--> Database is ACTIVE and READY.")
    else:
        print("\n--> Error Details:")
        print(f"    Type    : {diag['error_type']}")
        print(f"    Message : {diag['error_message']}")
        print("\n--> Root Cause Analysis:")
        print(f"    {diag['cause']}")
        print("\n--> How to Fix:")
        print(f"    {diag['fix_instructions']}")
    print("=" * 60)


if __name__ == "__main__":
    report = asyncio.run(check_mongodb_connection())
    print_health_check_report(report)
    sys.exit(0 if report["success"] else 1)
