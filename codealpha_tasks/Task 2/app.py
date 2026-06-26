from flask import Flask, render_template, request, redirect, flash
import sqlite3
from datetime import datetime

app = Flask(__name__)
app.secret_key = "student123"

def get_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn


def reindex_student_ids(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM students ORDER BY id ASC")
    student_ids = [row[0] for row in cursor.fetchall()]

    for new_id, old_id in enumerate(student_ids, start=1):
        cursor.execute("UPDATE students SET id = ? WHERE id = ?", (new_id, old_id))

    conn.commit()

# -----------------------------
# DATABASE INITIALIZATION
# -----------------------------
def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            branch TEXT NOT NULL,
            year TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# -----------------------------
# HOME PAGE
# -----------------------------
@app.route("/")
def home():

    search = request.args.get("search", "").strip()
    sort_by = request.args.get("sort_by", "id")
    sort_order = request.args.get("sort_order", "asc")

    valid_columns = {"id", "name", "email", "branch", "year"}
    if sort_by not in valid_columns:
        sort_by = "id"
    if sort_order not in {"asc", "desc"}:
        sort_order = "asc"

    conn = get_connection()
    cursor = conn.cursor()

    if search:
        query = f"""
            SELECT * FROM students
            WHERE name LIKE ?
            OR email LIKE ?
            OR branch LIKE ?
            OR year LIKE ?
            ORDER BY {sort_by} {sort_order}
        """
        cursor.execute(query, (
            f"%{search}%",
            f"%{search}%",
            f"%{search}%",
            f"%{search}%"
        ))
    else:
        cursor.execute(f"SELECT * FROM students ORDER BY {sort_by} {sort_order}")

    students = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM students")
    total_students = cursor.fetchone()[0]

    conn.close()

    return render_template(
        "index.html",
        students=students,
        total_students=total_students,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )


# -----------------------------
# ADD RECORD
# -----------------------------
@app.route("/add", methods=["POST"])
def add():

    name = request.form["name"].strip()
    email = request.form["email"].strip().lower()
    branch = request.form["branch"].strip()
    year = request.form["year"].strip()

    created_at = datetime.now().strftime("%d-%b-%Y %I:%M %p")

    conn = get_connection()
    cursor = conn.cursor()

    # Check duplicate email
    cursor.execute(
        "SELECT id FROM students WHERE email = ?",
        (email,)
    )

    existing = cursor.fetchone()

    if existing:
        conn.close()
        flash("Student already exists with this email!", "danger")
        return redirect("/")

    cursor.execute("""
        INSERT INTO students
        (name, email, branch, year, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        name,
        email,
        branch,
        year,
        created_at
    ))

    reindex_student_ids(conn)
    conn.close()

    flash("Student added successfully!", "success")

    return redirect("/")


# -----------------------------
# DELETE RECORD
# -----------------------------
@app.route("/delete/<int:id>")
def delete(id):

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM students WHERE id=?",
        (id,)
    )

    reindex_student_ids(conn)
    conn.close()

    flash("Record Deleted Successfully!", "warning")

    return redirect("/")


# -----------------------------
# RUN APPLICATION
# -----------------------------
if __name__ == "__main__":
    init_db()
    app.run(debug=True)