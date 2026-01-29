# ============================================================
# 🛑 STOP - AGENT INSTRUCTIONS
# ============================================================
# This is an NPL + React project that requires setup BEFORE running.
#
# DO NOT:
# - Run npm commands directly
# - Start the dev server
# - Edit vite.config.ts or .replit
# - Modify workflows
#
# FIRST STEP: Ask user for config values:
# NPL_TENANT=my-company
# NPL_APP=my-app
# KEYCLOAK_ADMIN_USER
# KEYCLOAK_ADMIN_PASSWORD
#
# SECOND STEP: Run 'make setup' in the terminal
# This configures Noumena Cloud connection and prompts for login.
#
# READ: replit.md for full instructions
# ============================================================

{ pkgs }: {
  deps = [
    # Node.js for React frontend
    pkgs.nodejs_20
    pkgs.nodePackages.npm

    # Java for NPL CLI (some operations may need it)
    pkgs.jdk17

    # Utilities
    pkgs.curl
    pkgs.jq
    pkgs.bash
    pkgs.gnumake
  ];

  env = {
    # Add NPL CLI to PATH after installation
    PATH = "/home/runner/.npl/bin:$PATH";
  };
}
