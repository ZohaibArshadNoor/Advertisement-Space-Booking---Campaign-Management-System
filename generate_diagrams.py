import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs("diagrams", exist_ok=True)

# -------------------------------------------------------------
# 1. CORE BUSINESS WORKFLOW DIAGRAM
# -------------------------------------------------------------
def create_workflow_diagram():
    fig, ax = plt.subplots(figsize=(12, 10), dpi=300)
    ax.set_facecolor("#F8FAFC")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    # Title
    ax.text(50, 96, "End-to-End Campaign Lifecycle Workflow", 
            fontsize=16, fontweight="bold", ha="center", va="center", color="#0F172A")
    ax.text(50, 93, "10-Stage Sequential Pipeline from Registration to Execution & Reporting", 
            fontsize=10, style="italic", ha="center", va="center", color="#64748B")

    steps = [
        {"num": "1", "title": "Advertiser Registration", "desc": "Account signup & JWT Auth", "color": "#3B82F6", "x": 20, "y": 82},
        {"num": "2", "title": "Inventory Search", "desc": "Filter spaces by city & type", "color": "#3B82F6", "x": 50, "y": 82},
        {"num": "3", "title": "Availability Check", "desc": "Interval collision check", "color": "#3B82F6", "x": 80, "y": 82},
        
        {"num": "4", "title": "Campaign Creation", "desc": "Draft campaign container", "color": "#8B5CF6", "x": 80, "y": 62},
        {"num": "5", "title": "Quotation & Pricing", "desc": "Rate cards, taxes & terms", "color": "#8B5CF6", "x": 50, "y": 62},
        {"num": "6", "title": "Booking Approval", "desc": "Pessimistic lock & reserve", "color": "#8B5CF6", "x": 20, "y": 62},
        
        {"num": "7", "title": "Creative Approval Gate", "desc": "Dimensions & media review", "color": "#F59E0B", "x": 20, "y": 42},
        {"num": "8", "title": "Payment & Invoicing Gate", "desc": "Invoice settled / reconciled", "color": "#F59E0B", "x": 50, "y": 42},
        {"num": "9", "title": "Campaign Execution", "desc": "Status -> ACTIVE, goes live", "color": "#10B981", "x": 80, "y": 42},
        
        {"num": "10", "title": "Completion & Analytics", "desc": "Audit logs & KPI reporting", "color": "#10B981", "x": 50, "y": 20},
    ]

    for s in steps:
        box = patches.FancyBboxPatch((s["x"]-12, s["y"]-6), 24, 12, boxstyle="round,pad=0.8",
                                     linewidth=1.5, edgecolor=s["color"], facecolor="#FFFFFF")
        ax.add_patch(box)
        
        badge = patches.Circle((s["x"]-9, s["y"]+3), 2.2, facecolor=s["color"], edgecolor="none")
        ax.add_patch(badge)
        ax.text(s["x"]-9, s["y"]+3, s["num"], color="white", fontsize=9, fontweight="bold", ha="center", va="center")
        
        ax.text(s["x"]-6, s["y"]+3, s["title"], fontsize=9.5, fontweight="bold", ha="left", va="center", color="#0F172A")
        ax.text(s["x"], s["y"]-2, s["desc"], fontsize=7.5, ha="center", va="center", color="#475569")

    arrows = [
        ((32, 82), (38, 82)),
        ((62, 82), (68, 82)),
        ((80, 76), (80, 68)),
        ((68, 62), (62, 62)),
        ((38, 62), (32, 62)),
        ((20, 56), (20, 48)),
        ((32, 42), (38, 42)),
        ((62, 42), (68, 42)),
        ((80, 36), (65, 26)),
    ]

    for start, end in arrows:
        ax.annotate("", xy=end, xytext=start,
                    arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6",
                                    color="#94A3B8", lw=2))

    plt.tight_layout()
    plt.savefig("diagrams/workflow_diagram.png", bbox_inches="tight")
    plt.close()
    print("Workflow diagram generated.")

# -------------------------------------------------------------
# 2. SYSTEM ARCHITECTURE DIAGRAM
# -------------------------------------------------------------
def create_architecture_diagram():
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_facecolor("#F8FAFC")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 96, "System Architecture: Decoupled 3-Tier Enterprise Design", 
            fontsize=16, fontweight="bold", ha="center", va="center", color="#0F172A")
    ax.text(50, 92, "React 19 Vite SPA <---> Flask REST API Modular Blueprints <---> PostgreSQL Database", 
            fontsize=9.5, style="italic", ha="center", va="center", color="#64748B")

    # Column 1: Frontend
    box_fe = patches.FancyBboxPatch((4, 15), 26, 72, boxstyle="round,pad=1",
                                    linewidth=2, edgecolor="#3B82F6", facecolor="#EFF6FF")
    ax.add_patch(box_fe)
    ax.text(17, 83, "Frontend Client", fontsize=12, fontweight="bold", color="#1E40AF", ha="center")
    ax.text(17, 80, "Vite + React 19 SPA", fontsize=9, color="#3B82F6", ha="center")

    fe_items = [
        "19 Feature Modules",
        "React Router v7",
        "Auth & Theme Context",
        "Axios HTTP Client",
        "JWT Request Interceptor",
        "401 Response Redirect",
        "Bootstrap 5 Responsive UI",
        "Chart.js Analytics",
        "Three.js 3D Visualizer"
    ]
    for i, item in enumerate(fe_items):
        y_pos = 73 - (i * 6.2)
        item_box = patches.FancyBboxPatch((6, y_pos-2), 22, 4.5, boxstyle="round,pad=0.3",
                                         linewidth=1, edgecolor="#BFDBFE", facecolor="#FFFFFF")
        ax.add_patch(item_box)
        ax.text(17, y_pos, item, fontsize=8, ha="center", va="center", color="#1E293B")

    # Column 2: Backend API
    box_be = patches.FancyBboxPatch((37, 15), 26, 72, boxstyle="round,pad=1",
                                    linewidth=2, edgecolor="#10B981", facecolor="#ECFDF5")
    ax.add_patch(box_be)
    ax.text(50, 83, "Backend Server", fontsize=12, fontweight="bold", color="#065F46", ha="center")
    ax.text(50, 80, "Flask REST API (Python)", fontsize=9, color="#10B981", ha="center")

    be_items = [
        "Application Factory (create_app)",
        "Flask Blueprints (14 Modules)",
        "Marshmallow Schemas (Validation)",
        "Flask-JWT-Extended Security",
        "RBAC Role Decorators",
        "Business Logic Service Layer",
        "Centralized Error Handlers",
        "Flasgger (Swagger / OpenAPI)",
        "Alembic Database Migrations"
    ]
    for i, item in enumerate(be_items):
        y_pos = 73 - (i * 6.2)
        item_box = patches.FancyBboxPatch((39, y_pos-2), 22, 4.5, boxstyle="round,pad=0.3",
                                         linewidth=1, edgecolor="#A7F3D0", facecolor="#FFFFFF")
        ax.add_patch(item_box)
        ax.text(50, y_pos, item, fontsize=8, ha="center", va="center", color="#1E293B")

    # Column 3: Persistence & Database
    box_db = patches.FancyBboxPatch((70, 15), 26, 72, boxstyle="round,pad=1",
                                    linewidth=2, edgecolor="#8B5CF6", facecolor="#F5F3FF")
    ax.add_patch(box_db)
    ax.text(83, 83, "Database & Storage", fontsize=12, fontweight="bold", color="#5B21B6", ha="center")
    ax.text(83, 80, "PostgreSQL + File Store", fontsize=9, color="#8B5CF6", ha="center")

    db_items = [
        "22 Relational Tables",
        "SQLAlchemy ORM Models",
        "Pessimistic Row Locking",
        "Interval Collision Checks",
        "Roles & Permissions JSON",
        "Campaigns & Bookings",
        "Invoices & Payments Ledger",
        "Immutable Audit Logs",
        "uploads/ Media Filesystem"
    ]
    for i, item in enumerate(db_items):
        y_pos = 73 - (i * 6.2)
        item_box = patches.FancyBboxPatch((72, y_pos-2), 22, 4.5, boxstyle="round,pad=0.3",
                                         linewidth=1, edgecolor="#DDD6FE", facecolor="#FFFFFF")
        ax.add_patch(item_box)
        ax.text(83, y_pos, item, fontsize=8, ha="center", va="center", color="#1E293B")

    # Two-way Connectors
    ax.annotate("", xy=(37, 52), xytext=(30, 52),
                arrowprops=dict(arrowstyle="<->,head_width=0.4,head_length=0.6",
                                color="#2563EB", lw=2.5))
    ax.text(33.5, 55, "REST / JSON\nBearer JWT", fontsize=7.5, fontweight="bold", ha="center", color="#2563EB")

    ax.annotate("", xy=(70, 52), xytext=(63, 52),
                arrowprops=dict(arrowstyle="<->,head_width=0.4,head_length=0.6",
                                color="#059669", lw=2.5))
    ax.text(66.5, 55, "SQLAlchemy\nTCP 5432", fontsize=7.5, fontweight="bold", ha="center", color="#059669")

    plt.tight_layout()
    plt.savefig("diagrams/system_architecture.png", bbox_inches="tight")
    plt.close()
    print("System architecture diagram generated.")

# -------------------------------------------------------------
# 3. CORE BUSINESS GUARDRAILS & GATES
# -------------------------------------------------------------
def create_guardrails_diagram():
    fig, ax = plt.subplots(figsize=(12, 7), dpi=300)
    ax.set_facecolor("#F8FAFC")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 95, "The 3 Non-Negotiable Business Guardrails", 
            fontsize=16, fontweight="bold", ha="center", va="center", color="#0F172A")
    ax.text(50, 90, "Strict Integrity Gates Enforced by Backend Service Layer", 
            fontsize=10, style="italic", ha="center", va="center", color="#64748B")

    guards = [
        {
            "x": 6, "color": "#EF4444", "bg": "#FEF2F2", "border": "#FCA5A5",
            "title": "GUARDRAIL 1",
            "subtitle": "Zero Double-Booking",
            "bullets": [
                "• Row-level pessimistic locking via\n  .with_for_update() on space inventory.",
                "• Strict interval intersection logic:\n  Existing_Start <= Requested_End AND\n  Existing_End >= Requested_Start",
                "• Atomically blocks SpaceAvailability.",
                "• Returns HTTP 409 Conflict if\n  overlapping slot is reserved."
            ]
        },
        {
            "x": 38, "color": "#F59E0B", "bg": "#FFFBEB", "border": "#FDE68A",
            "title": "GUARDRAIL 2",
            "subtitle": "Creative Quality Gate",
            "bullets": [
                "• Campaign cannot activate without\n  approved creative assets.",
                "• Asset undergoes human review by\n  Creative Reviewer role.",
                "• Validates resolution, aspect ratio,\n  dimensions, and content decency.",
                "• If REJECTED, uploader receives\n  feedback to submit versioned re-upload."
            ]
        },
        {
            "x": 70, "color": "#10B981", "bg": "#ECFDF5", "border": "#A7F3D0",
            "title": "GUARDRAIL 3",
            "subtitle": "Financial Settlement Gate",
            "bullets": [
                "• Campaign cannot transition to\n  ACTIVE until payment threshold is met.",
                "• Automated invoice reconciliation\n  calculates amount_paid & balance_due.",
                "• Supports split/partial payments\n  (Status: ISSUED -> PARTIAL -> PAID).",
                "• Only Finance Officer or Admin\n  can verify offline payments."
            ]
        }
    ]

    for g in guards:
        box = patches.FancyBboxPatch((g["x"], 12), 24, 72, boxstyle="round,pad=1",
                                     linewidth=1.8, edgecolor=g["border"], facecolor=g["bg"])
        ax.add_patch(box)
        
        banner = patches.FancyBboxPatch((g["x"]+1, 72), 22, 9, boxstyle="round,pad=0.4",
                                       linewidth=0, facecolor=g["color"])
        ax.add_patch(banner)
        ax.text(g["x"]+12, 78, g["title"], fontsize=9.5, fontweight="bold", color="#FFFFFF", ha="center")
        ax.text(g["x"]+12, 74, g["subtitle"], fontsize=8.5, fontweight="bold", color="#FFFFFF", ha="center")

        y = 65
        for b in g["bullets"]:
            ax.text(g["x"]+2, y, b, fontsize=8, color="#1E293B", va="top", ha="left")
            y -= 13

    plt.tight_layout()
    plt.savefig("diagrams/guardrails_diagram.png", bbox_inches="tight")
    plt.close()
    print("Guardrails diagram generated.")

# -------------------------------------------------------------
# 4. THE 6 USER ROLES & RESPONSIBILITIES MATRIX
# -------------------------------------------------------------
def create_roles_diagram():
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_facecolor("#F8FAFC")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 96, "The 6 System Roles & Operational Scope", 
            fontsize=16, fontweight="bold", ha="center", va="center", color="#0F172A")
    ax.text(50, 92, "Role-Based Access Control (RBAC) Architecture", 
            fontsize=10, style="italic", ha="center", va="center", color="#64748B")

    roles = [
        {"title": "1. Advertiser", "color": "#2563EB", "x": 5, "y": 52,
         "scope": "External Client",
         "actions": ["• Discover & filter ad spaces", "• Create draft campaigns", "• Submit booking requests", "• Upload creative media", "• Review invoices & pay", "• Track live campaign KPIs"]},
        
        {"title": "2. Sales Executive", "color": "#0D9488", "x": 37, "y": 52,
         "scope": "Agency Commercial",
         "actions": ["• Manage advertiser accounts", "• Generate custom quotations", "• Coordinate campaign pipeline", "• Apply pricing discounts", "• Assist client reservations", "• Monitor sales revenue"]},

        {"title": "3. Space Manager", "color": "#7C3AED", "x": 69, "y": 52,
         "scope": "Inventory Operations",
         "actions": ["• Register spaces & categories", "• Maintain GPS locations", "• Configure rate cards & base rates", "• Manage availability calendar", "• Block spaces for maintenance", "• Review pending space bookings"]},

        {"title": "4. Creative Reviewer", "color": "#D97706", "x": 5, "y": 12,
         "scope": "Quality Assurance",
         "actions": ["• Inspect pending creative queue", "• Validate aspect ratios & resolution", "• Verify compliance & decency", "• Approve media for broadcast", "• Reject with detailed feedback", "• Review revision history"]},

        {"title": "5. Finance Officer", "color": "#059669", "x": 37, "y": 12,
         "scope": "Accounting & Billing",
         "actions": ["• Issue campaign invoices", "• Calculate sales tax / VAT", "• Record & verify offline payments", "• Track outstanding balances", "• Manage partial settlements", "• Export financial audit reports"]},

        {"title": "6. Administrator", "color": "#DC2626", "x": 69, "y": 12,
         "scope": "Master Governance",
         "actions": ["• Provision & deactivate users", "• Modify role permissions JSON", "• Inspect immutable audit logs", "• Global system oversight", "• Emergency override authority", "• Database backup & maintenance"]}
    ]

    for r in roles:
        box = patches.FancyBboxPatch((r["x"], r["y"]), 26, 36, boxstyle="round,pad=0.8",
                                     linewidth=1.5, edgecolor=r["color"], facecolor="#FFFFFF")
        ax.add_patch(box)
        
        header = patches.FancyBboxPatch((r["x"]+0.5, r["y"]+28), 25, 7, boxstyle="round,pad=0.3",
                                       linewidth=0, facecolor=r["color"])
        ax.add_patch(header)
        ax.text(r["x"]+13, r["y"]+32.5, r["title"], fontsize=9.5, fontweight="bold", color="#FFFFFF", ha="center")
        ax.text(r["x"]+13, r["y"]+29.5, f"[{r['scope']}]", fontsize=7.5, color="#E2E8F0", ha="center")

        y = r["y"] + 25
        for act in r["actions"]:
            ax.text(r["x"]+1.5, y, act, fontsize=7.5, color="#334155", ha="left", va="top")
            y -= 4.2

    plt.tight_layout()
    plt.savefig("diagrams/roles_matrix.png", bbox_inches="tight")
    plt.close()
    print("Roles matrix diagram generated.")

# -------------------------------------------------------------
# 5. INITIATION LIFECYCLE DIAGRAM (FACULTY DEFENSE FOCUS)
# -------------------------------------------------------------
def create_initiation_diagram():
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_facecolor("#F8FAFC")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 96, "Application & Database Initiation Lifecycle", 
            fontsize=16, fontweight="bold", ha="center", va="center", color="#0F172A")
    ax.text(50, 92, "Step-by-Step Execution Sequence from Command Line to Serving Requests", 
            fontsize=10, style="italic", ha="center", va="center", color="#64748B")

    blocks = [
        {"num": "Step 1", "title": "Root Execution", "sub": "run.py / wsgi.py", "desc": "python run.py calls\napp = create_app()", "x": 10, "y": 70, "col": "#2563EB"},
        {"num": "Step 2", "title": "Environment Config", "sub": "config.py", "desc": "Loads .env variables\nDB URI, JWT secret, CORS", "x": 40, "y": 70, "col": "#2563EB"},
        {"num": "Step 3", "title": "Application Factory", "sub": "app/__init__.py", "desc": "app = Flask(__name__)\nConfig attached to app", "x": 70, "y": 70, "col": "#2563EB"},
        
        {"num": "Step 4", "title": "Extensions Attachment", "sub": "extensions.py + init_app()", "desc": "db.init_app(app)\nmigrate.init_app(app, db)\njwt.init_app(app)\nSwagger(app)", "x": 70, "y": 25, "col": "#059669"},
        {"num": "Step 5", "title": "Blueprint Registration", "sub": "14 Domain Blueprints", "desc": "app.register_blueprint(auth_bp)\napp.register_blueprint(spaces_bp)\n... bookings, invoices, etc.", "x": 40, "y": 25, "col": "#059669"},
        {"num": "Step 6", "title": "Error Middleware & Run", "sub": "register_error_handlers()", "desc": "Centralized error capture\napp.run(debug=True)\nListens on port 5000", "x": 10, "y": 25, "col": "#059669"},
    ]

    for b in blocks:
        box = patches.FancyBboxPatch((b["x"]-8, b["y"]-12), 20, 24, boxstyle="round,pad=0.8",
                                     linewidth=1.5, edgecolor=b["col"], facecolor="#FFFFFF")
        ax.add_patch(box)
        
        header = patches.FancyBboxPatch((b["x"]-7.5, b["y"]+5.5), 19, 6, boxstyle="round,pad=0.3",
                                       linewidth=0, facecolor=b["col"])
        ax.add_patch(header)
        ax.text(b["x"]+2, b["y"]+9, b["num"], fontsize=8.5, fontweight="bold", color="#FFFFFF", ha="center")
        ax.text(b["x"]+2, b["y"]+6.5, b["title"], fontsize=8, color="#FFFFFF", ha="center")

        ax.text(b["x"]+2, b["y"]+1.5, b["sub"], fontsize=8, fontweight="bold", color="#0F172A", ha="center")
        ax.text(b["x"]+2, b["y"]-6, b["desc"], fontsize=7.2, color="#475569", ha="center")

    arrows = [
        ((22, 70), (30, 70)),
        ((52, 70), (60, 70)),
        ((72, 56), (72, 40)),
        ((60, 25), (52, 25)),
        ((30, 25), (22, 25)),
    ]

    for start, end in arrows:
        ax.annotate("", xy=end, xytext=start,
                    arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6",
                                    color="#64748B", lw=2))

    plt.tight_layout()
    plt.savefig("diagrams/initiation_flow.png", bbox_inches="tight")
    plt.close()
    print("Initiation flow diagram generated.")

if __name__ == "__main__":
    create_workflow_diagram()
    create_architecture_diagram()
    create_guardrails_diagram()
    create_roles_diagram()
    create_initiation_diagram()
    print("All 5 diagrams successfully generated!")
