from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_file, current_app
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user
import psycopg2
from werkzeug.utils import secure_filename
import os
import json 
from datetime import datetime
import logging
from flask import send_from_directory
from datetime import datetime, timedelta
from datetime import date


app = Flask(__name__)
app.secret_key = 'mansi'  # For session management
# app.config["SESSION_PERMANENT"] = True 
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_FILE_DIR"] = "./flask_session"  

login_manager = LoginManager()
# login_manager.login_view = 'signin'
login_manager.init_app(app)

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
# Database configuration
db_config = {
    "host": "localhost",
    "database": "HRM",
    "user": "postgres",
    "password": "mansi",
    "port": "5432",
}

# Function to create a database connection
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=db_config["host"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            port=db_config["port"],
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

class User(UserMixin):
    def __init__(self, emp_id, first_name, last_name, email, photo=None):
        self.emp_id = emp_id
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.photo = photo

    def get_id(self):
        return str(self.emp_id)

@login_manager.user_loader
def load_user(emp_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT emp_id, first_name, last_name, email, photo FROM employee WHERE emp_id = %s", (emp_id,))
    user_data = cursor.fetchone()
    cursor.close()
    conn.close()

    if user_data:
        print(f"Loaded User: {user_data}")
        return User(*user_data)  # Create and return a User instance
    return None

@app.route("/", methods=["GET"])
def welcome():
    return render_template("welcome.html")


@app.route("/signin", methods=["GET", "POST"])
def signin():
    if request.method == "POST":
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        role = data.get("role")  # Get role from frontend

        if not email or not password or not role:
            return jsonify({"success": False, "message": "Email, password, and role are required!"}), 400

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Clear session based on role
            session.clear()  # Clears all session data before login

            if role == "employee":
                cursor.execute("SELECT emp_id, first_name, last_name, email, photo FROM employee WHERE email = %s AND password = %s", (email, password))
                user = cursor.fetchone()

                if user:
                    user_obj = User(*user[:5])
                    login_user(user_obj)  # Log in user

                    session["emp_id"] = user[0]
                    session["role"] = "employee"

                    checkin_time = datetime.now().strftime("%I:%M %p")
                    cursor.execute("""
                        INSERT INTO logs (emp_id, date, checkin)
                        VALUES (%s, CURRENT_DATE, %s)
                        ON CONFLICT (emp_id, date)
                        DO UPDATE SET checkin = EXCLUDED.checkin;
                    """, (user[0], checkin_time))
                    conn.commit()

                    cursor.close()
                    conn.close()
                    return jsonify({"success": True, "message": "Employee sign-in successful!", "redirect": url_for('dashboard')}), 200

            elif role == "admin":
                cursor.execute("SELECT admin_id, email, category FROM admin WHERE email = %s AND password = %s", (email, password))
                user = cursor.fetchone()

                if user:
                    session["admin_email"] = email
                    session["admin_id"] = user[0]
                    session["role"] = "admin"

                    cursor.close()
                    conn.close()
                    return jsonify({"success": True, "message": "Admin sign-in successful!", "redirect": url_for('admin_dashboard')}), 200

            elif role == "superadmin":
                cursor.execute("SELECT spadmin_id, email FROM superadmin WHERE email = %s AND password = %s", (email, password))
                user = cursor.fetchone()

                if user:
                    session["superadmin_email"] = email
                    session["superadmin_id"] = user[0]
                    session["role"] = "superadmin"

                    cursor.close()
                    conn.close()
                    return jsonify({"success": True, "message": "Superadmin sign-in successful!", "redirect": url_for('supadmin_dashboard')}), 200

            else:
                return jsonify({"success": False, "message": "Invalid role!"}), 400

        except Exception as e:
            print(f"DEBUG: Error in signin - {e}")
            return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    return render_template("signin.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        email = request.form.get("email")
        phone = request.form.get("phone")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")
        date_of_birth = request.form.get("date_of_birth")
        address = request.form.get("address")
        photo = request.files.get("photo")
        resume = request.files.get("resume_path")
        type = request.form.get("type")  # Get type field

        if not all([first_name.strip(), last_name.strip(), email.strip(), phone.strip(), password.strip(), confirm_password.strip(), date_of_birth.strip(), address.strip(), type.strip()]) or not (photo and resume and photo.filename.strip() and resume.filename.strip()):
            return jsonify({"success": False, "message": "Please fill in all required fields."}), 400

        if password != confirm_password:
            return jsonify({"success": False, "message": "Passwords do not match!"}), 400
        
        allowed_types = {"employee", "consultant", "intern"}
        if type.lower() not in allowed_types:
            return jsonify({"success": False, "message": "Invalid employee type!"}), 400
        try:
            photo_filename = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(photo.filename))
            resume_filename = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(resume.filename))

            # Save the files
            photo.save(photo_filename)
            resume.save(resume_filename)

            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO employee (first_name, last_name, email, phone, password, date_of_birth, address, photo, resume_path , type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::employee_type)
                """,
                (first_name, last_name, email, phone, password, date_of_birth, address, photo_filename, resume_filename,type),
            )
            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({"success": True, "message": "Registration successful!"}), 200
        except Exception as e:
            return jsonify({"success": False, "message": "Internal Server Error. Please try again!"}), 500

    return render_template("register.html")

def get_user_profile(emp_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT photo FROM employee WHERE emp_id = %s", (emp_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result[0] if result else None

@app.route('/profile_picture/<int:user_id>')
@login_required
def get_profile_picture(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT photo FROM employee WHERE emp_id = %s", (user_id,))
    result = cur.fetchone() 
    cur.close()
    conn.close() 

    if result and result[0]:
        return send_file(result[0], mimetype='image/jpeg')  # If image is stored as path
    else:
        return send_file('static/default_profile.png', mimetype='image/png')  # Default image

@app.after_request
def prevent_cache(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route("/dashboard", methods=["GET"])
@login_required
def dashboard():
    if "emp_id" not in session:  # Ensure employee is logged in
        return redirect(url_for("signin"))
    
    emp_id = session["emp_id"]  # Get emp_id from session
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Fetch user details along with type (employee/intern)
    cur.execute("SELECT first_name, last_name, email, photo, type FROM employee WHERE emp_id = %s", (emp_id,))
    user_data = cur.fetchone()
    cur.close()
    conn.close()

    if not user_data:
        return redirect(url_for("signin"))  # Redirect if user not found

    user_info = {
        "name": f"{user_data[0]} {user_data[1]}",
        "email": user_data[2],
        "photo_url": user_data[3] if user_data[3] else "static/default.jpg",
        "user_type": user_data[4],  # Employee type (intern/employee)
    }

    # Define common menu items
    menu_items = [
        {"name": "My Profile", "route": "/profile"},
        {"name": "Employee Detail", "route": "/employee_detail"},
        {"name": "Notifications", "route": "/notifications"},
        {"name": "Apply for Leave", "route": "/apply_leave"},
        {"name": "Attendance", "route": "/attendance"},
        {"name": "Invoice", "route": "/invoice"},
        {"name": "Expense", "route": "/expense"},
        {"name": "Announcements", "route": "/announcements"},
        {"name": "Calendar", "route": "/calendar"},
        {"name": "Contact", "route": "/contact"},
    ]

    # Add Salary Slip or Stipend based on user type
    # if user_info["user_type"] == []"employee":
    if user_info["user_type"] in ["employee", "consultant"]:
        menu_items.append({"name": "Salary Slip", "route": "/salary_slip"})
    
    elif user_info["user_type"] == "intern":
        menu_items.append({"name": "Stipend", "route": "/stipend"})

    return render_template("dashboard.html", user_info=user_info, menu_items=menu_items)

@app.route('/stipend')
def stipend():
    user_info = {
        "type": "intern"  # Replace this with actual user type retrieval logic
    }
    return render_template("stipend.html", user_info=user_info)

@app.route('/employee')
@login_required
def employee():
    # Fetch emp_id from session
    emp_id = session.get('emp_id')
    if not emp_id:
        return redirect(url_for("signin"))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Execute query to fetch employee details along with user_type
        cursor.execute("""
            SELECT first_name, last_name, emp_id, date_of_birth, email, address, phone, emergency_number, gender, type
            FROM employee WHERE emp_id = %s
        """, (emp_id,))
        employee_details = cursor.fetchone()

        cursor.close()
        conn.close()

        if not employee_details:
            return redirect(url_for("signin"))  # Redirect if no employee record found

        first_name, last_name, emp_id, date_of_birth, email, address, phone, emergency_number, gender, user_type = employee_details
        profile_name = f"{first_name} {last_name}"

        # Store user_info in a dictionary to pass to the template
        user_info = {
            "name": profile_name,
            "user_type": user_type  # Added user_type for conditional rendering
        }

        return render_template('employee.html', user_info=user_info,
                            #    first_name=first_name, last_name=last_name, 
                                profile_name=profile_name,
                               emp_id=emp_id, date_of_birth=date_of_birth, 
                               email=email, address=address, phone=phone,
                               emergency_number=emergency_number, gender=gender)
    except Exception as e:
        print(f"DEBUG: Error in /employee route - {e}")
        return "Internal Server Error", 500
    # return render_template('employee.html', profile_name=profile_name, emp_id=emp_id, ...)

@app.route('/update_employee', methods=['POST'])
@login_required
def update_employee():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        data = request.json

        emp_id = session.get('emp_id') or current_user.get_id()
        email = data.get("email")
        address = data.get("address")
        phone = data.get("phone")
        emergency_number = data.get("emergency_number")
        gender = data.get("gender")


        print("Received Data:", data)  # Debugging line

        if not emp_id:  # If emp_id is missing, return an error
            return jsonify({"success": False, "error": "Employee ID is required!"})

        valid_genders = {"Male", "Female", "Other"}
        if not gender or gender not in valid_genders:
            return jsonify({"error": "Invalid gender selected!"}), 400

        # Update employee details in the database
        cursor.execute("SELECT * FROM employee WHERE emp_id = %s", (emp_id,))
        existing_record = cursor.fetchone()

        if existing_record:
            # Update existing record
            query = """
            UPDATE employee
            SET email = %s, address = %s, phone = %s, emergency_number = %s, gender = %s
            WHERE emp_id = %s
            """
            cursor.execute(query, (email, address, phone, emergency_number, gender, emp_id))
            print("Data updated successfully!")
        else:
            # Insert new record
            query = """ 
            INSERT INTO employee (emp_id, email , address , phone , emergency_number , gender)
            VALUES (%s,%s,%s,%s,%s,%s)
            """
            cursor.execute(query, (email, address, phone, emergency_number, gender, emp_id))
            print("Data inserted successfully!")

        conn.commit() 

        return jsonify({
            "message": "Financial details stored successfully!",
            "email": email,
            "address": address,
            "phone": phone,
            "emergency_number": emergency_number,
            "gender": gender,
        }), 200

    except Exception as e:
        conn.rollback()
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
    
@app.route("/get_employee_details", methods=["GET"])
@login_required
def get_employee_details():
    emp_id = session.get('emp_id') 
    # data = request.json
    if not emp_id:
        return jsonify({"success": False, "message": "Employee ID not found in session."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT email, address, phone, emergency_number, gender FROM employee WHERE emp_id = %s", (emp_id,))
        employee = cursor.fetchone()
        cursor.close()
        conn.close() 
        if employee:
            employee_data = {
                "email": employee[0],
                "address": employee[1],
                "phone": employee[2],
                "emergency_number": employee[3],
                "gender": employee[4] if employee[4] else "Not Set"
            }
            return jsonify({"success": True, "employee": employee_data})
        else:
            return jsonify({"success": False, "message": "Employee details not found."}), 404

    except Exception as e:
        print(f"Error fetching employee details: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/store_financial_detail', methods=['POST'])
@login_required
def store_financial_detail():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        data = request.json  # Get JSON data from frontend

        emp_id = session.get('emp_id') or current_user.get_id()

        bank_name = data.get("bank_name")
        account_number = data.get("account_number")
        ifsc_code = data.get("ifsc_code")
        account_name = data.get("account_name")
        bank_address = data.get("bank_address")
        pincode = data.get("pincode")

        print("Received Data:", emp_id, bank_name, account_number, ifsc_code, account_name, bank_address, pincode)

        # Check if financial details exist
        cursor.execute("SELECT * FROM financial_detail WHERE emp_id = %s", (emp_id,))
        existing_record = cursor.fetchone()

        if existing_record:
            # Update existing record
            query = """
            UPDATE financial_detail 
            SET bank_name=%s, account_number=%s, ifsc_code=%s, account_name=%s, bank_address=%s, pincode=%s
            WHERE emp_id=%s
            """
            cursor.execute(query, (bank_name, account_number, ifsc_code, account_name, bank_address, pincode, emp_id))
            print("Data updated successfully!")
        else:
            # Insert new record
            query = """
            INSERT INTO financial_detail (emp_id, bank_name, account_number, ifsc_code, account_name, bank_address, pincode)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (emp_id, bank_name, account_number, ifsc_code, account_name, bank_address, pincode))
            print("Data inserted successfully!")

        conn.commit()

        # Return the updated data
        return jsonify({
            "message": "Financial details stored successfully!",
            "bank_name": bank_name,
            "account_number": account_number,
            "ifsc_code": ifsc_code,
            "account_name": account_name,
            "bank_address": bank_address,
            "pincode": pincode
        }), 200

    except Exception as e:
        conn.rollback()
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/store_skills_interests', methods=['POST'])
@login_required
def store_skills_interests():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        data = request.json
        emp_id = session.get('emp_id') or current_user.get_id()

        skills = data.get("skills", [])
        soft_skills = data.get("soft_skills", [])
        interests = data.get("interests", [])

        print("Received Data:", emp_id, skills, soft_skills, interests)

        cursor.execute("SELECT * FROM skillsandinterest WHERE emp_id = %s", (emp_id,))
        existing_record = cursor.fetchone()

        if existing_record:
            query = """
            UPDATE skillsandinterest
            SET skills= %s, soft_skills = %s, interests = %s
            WHERE emp_id= %s
            """
            cursor.execute(query, (skills, soft_skills, interests, emp_id))
            print("✅ Skills & Interests updated successfully!")
        else:
            query = """
            INSERT INTO skillsandinterest (emp_id, skills, soft_skills, interests)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (emp_id, skills, soft_skills, interests))
            print("✅ Skills & Interests inserted successfully!")
        conn.commit()

        return jsonify({"message": "Skills and Interests stored successfully!", "skills": skills, "soft_skills": soft_skills, "interests": interests}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/get_financial_detail', methods=['GET'])
@login_required
def get_financial_detail():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        emp_id = session.get('emp_id') or current_user.get_id()
        
        cursor.execute("SELECT bank_name, account_number, ifsc_code, account_name, bank_address, pincode FROM financial_detail WHERE emp_id = %s", (emp_id,))
        record = cursor.fetchone()
        
        if record:
            financial_data = {
                "bank_name": record[0],
                "account_number": record[1],
                "ifsc_code": record[2],
                "account_name": record[3],
                "bank_address": record[4],
                "pincode": record[5]
            }
        else:
            financial_data = {
                "bank_name": "Not provided",
                "account_number": "Not provided",
                "ifsc_code": "Not provided",
                "account_name": "Not provided",
                "bank_address": "Not provided",
                "pincode": "Not provided"
            }

        return jsonify(financial_data), 200

    except Exception as e:
        print("Error fetching financial details:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/get_skills_interests', methods=['GET'])
@login_required
def get_skills_interests():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        emp_id = session.get('emp_id') or current_user.get_id()

        cursor.execute("SELECT skills, soft_skills, interests FROM skillsandinterest WHERE emp_id = %s", (emp_id,))
        record = cursor.fetchone()
        if record:
            skills_data = {"skills": record[0], "soft_skills": record[1], "interests": record[2]}
        else:
            skills_data = {"skills": [], "soft_skills": [], "interests": []}
        
        return jsonify(skills_data), 200
    except Exception as e:
        print("Error fetching skills and interests:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close() 

@app.route('/store_social_links', methods=['POST'])
@login_required
def store_social_links():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        data = request.json
        emp_id = session.get('emp_id') or current_user.get_id()
        linkedin = data.get("linkedin")
        github = data.get("github")
        twitter = data.get("twitter")

        cursor.execute("SELECT * FROM social WHERE emp_id = %s", (emp_id,))
        existing_record = cursor.fetchone()

        if existing_record:
            cursor.execute(
                """
                UPDATE social 
                SET linkedIn=%s, github=%s, twitter=%s 
                WHERE emp_id=%s
                """, (linkedin, github, twitter, emp_id)
            )
        else:
            cursor.execute(
                """
                INSERT INTO social (emp_id, linkedin, github, twitter) 
                VALUES (%s, %s, %s, %s)
                """, (emp_id, linkedin, github, twitter)
            )
        
        conn.commit()
        return jsonify({"message": "Social links stored successfully!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/get_social_links', methods=['GET'])
@login_required
def get_social_links():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        emp_id = session.get('emp_id') or current_user.get_id()
        cursor.execute("SELECT linkedin, github, twitter FROM social WHERE emp_id = %s", (emp_id,))
        record = cursor.fetchone()

        social_data = {
            "linkedin": record[0] if record else "Not provided",
            "github": record[1] if record else "Not provided",
            "twitter": record[2] if record else "Not provided"
        }
        return jsonify(social_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/leave')
@login_required
def leave():
    return render_template('leave.html')



@app.route('/apply_leave', methods=['GET', 'POST'])
@login_required
def apply_leave():
    session.permanent = True  
    emp_id = session.get('emp_id')
    
    if not emp_id:
        return redirect(url_for("signin"))  # Redirect if user is not logged in
    
    user_info = None
    
    if request.method == 'GET':
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            # Fetch user details including `type`
            cur.execute("SELECT first_name, email, type FROM employee WHERE emp_id = %s", (emp_id,))
            user_data = cur.fetchone()  
            
            if user_data:
                user_info = {
                    "name": user_data[0],
                    "email": user_data[1],
                    "type": user_data[2]  # Ensuring `type` is passed
                }
            print("DEBUG - User Info:", user_info)  # Debugging Output
        except Exception as e:
            user_info = None
            print("DEBUG - Database Error:", e)
        finally:
            cur.close()
            conn.close()
        
        return render_template('leave.html', user_info=user_info)  # Ensure user_info is always passed

    elif request.method == 'POST':
        slot = request.form.get('slot')
        from_date = request.form.get('from_date')
        to_date = request.form.get('to_date')
        apply_to_list = request.form.getlist('apply_to')
        reason = request.form.get('reason')
        apply_to = ", ".join(apply_to_list) if apply_to_list else "None"
        
        document_file = request.files.get('document')
        document_filename = None
        if document_file and document_file.filename != '':
            if allowed_file(document_file.filename):
                document_filename = secure_filename(document_file.filename)
                file_path = os.path.join(app.config["UPLOAD_FOLDER"], document_filename)
                document_file.save(file_path)
            else:
                return jsonify({"error": "Invalid file type for attachment"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO leave_applications (emp_id, slot, start_date, end_date, apply_to, reason, document_path, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (emp_id, slot, from_date, to_date, apply_to, reason, document_filename, "Pending"))
            conn.commit()
        except Exception as e:
            conn.rollback()
            return jsonify({"error": "Database error: " + str(e)}), 500
        finally:
            cur.close()
            conn.close()
        
        return jsonify({
            "message": "Leave application submitted successfully!",
            "leave_application": {
                "slot": slot,
                "start_date": from_date,
                "end_date": to_date,
                "apply_to": apply_to,
                "reason": reason,
                "document_path": f"/static/uploads/{document_filename}" if document_filename else None,
                "status": "Pending"
            }
        }), 200



@app.route('/get_leave_applications', methods=['GET'])
def get_leave_applications():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT slot, start_date, end_date, apply_to, reason, document_path, status 
            FROM leave_applications 
            ORDER BY leave_id desc
        """)
        apps = cur.fetchall()
        print(f"Fetched {len(apps)} leave applications from the database.")
    except Exception as e:
        return jsonify({"error": "Database error: " + str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    result = []
    for app_row in apps:
        # Format dates as strings if they are date objects
        start_date = app_row[1].strftime('%Y-%m-%d') if hasattr(app_row[1], 'strftime') else app_row[1]
        end_date = app_row[2].strftime('%Y-%m-%d') if hasattr(app_row[2], 'strftime') else app_row[2]
        result.append({
            "slot": app_row[0],
            "start_date": start_date,
            "end_date": end_date,
            "apply_to": app_row[3],
            "reason": app_row[4],
            "document_path": f"/static/uploads/{app_row[5]}" if app_row[5] else None,
            "status": app_row[6]
        })
    return jsonify({"leave_applications": result})

@app.route('/invoice')
@login_required
def invoice():
    session.permanent = True  
    if "emp_id" not in session:
        return redirect(url_for("signin")) 

    user_info = get_user_info()
    return render_template('invoice.html', user_info=user_info)
@app.route('/upload_invoice', methods=['POST'])
def upload_invoice():
    print("Received request to upload invoice")

    # Fetch logged-in employee ID from session
    emp_id = session.get('emp_id')  # Assuming employee ID is stored in session

    if not emp_id:
        print("Employee ID not found in session")
        return jsonify({"error": "User not logged in"}), 401  # Unauthorized

    if 'invoice_doc' not in request.files:
        print("No file uploaded")
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['invoice_doc']

    if file.filename == '':
        print("No file selected")
        return jsonify({"error": "No selected file"}), 400
    if not allowed_file(file.filename):
        print("Invalid file type")
        return jsonify({"error": "Invalid file type. Allowed types: pdf, docx, doc, jpg, jpeg, png"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    conn = get_db_connection()
    cur = conn.cursor()

    now = datetime.now()
    today = now.strftime('%Y-%m-%d')  # YYYY-MM-DD
    current_time = now.strftime('%H:%M:%S')  # HH:MM:SS
    month = now.month
    month_name = now.strftime('%B')  # Get full month name (e.g., "February")
    year = now.year

    try:
        cur.execute("""
            INSERT INTO invoice (emp_id, invoice_doc, date, month, year) 
            VALUES (%s, %s, %s, %s, %s)
        """, (emp_id, filename, today, month, year))

        conn.commit()
        print("Data inserted successfully")

    except Exception as e:
        print(f"Database Error: {e}")
        conn.rollback()
        return jsonify({"error": "Database error"}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify({
        "message": "Invoice uploaded successfully!",
        "file_path": f"/static/uploads/{filename}",
        "date": today,
        "time": current_time,
        "month": month_name,  # Send full month name instead of number
        "year": year
    }), 200

@app.route('/get_invoices', methods=['GET'])
def get_invoices():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT date, month, year, invoice_doc FROM invoice ORDER BY date DESC")
    invoices = cur.fetchall()
    cur.close()
    conn.close()

    # Convert month number to month name
    result = []
    for i in invoices:
        date_str = i[0].strftime('%Y-%m-%d')  # Convert date to string
        month_number = int(i[1])
        month_name = datetime.strptime(str(month_number), "%m").strftime("%B")  # Convert to full month name
        result.append({
            "date": date_str,
            "month": month_name,  # Now it's the full month name
            "year": i[2],
            "file_path": f"/static/uploads/{i[3]}"  # Ensure correct path
        })

    return jsonify(result)

@app.route('/contact')
@login_required
def contact():
    session.permanent = True  
    if "emp_id" not in session:
        return redirect(url_for("signin")) 

    user_info = get_user_info()
    return render_template('contact.html', user_info=user_info)

@app.route('/expense') 
@login_required
def expense():
    session.permanent = True  
    if "emp_id" not in session:
        return redirect(url_for("signin")) 

    user_info = get_user_info()
    return render_template('expense.html', user_info=user_info)

@app.route("/get_emp_id", methods=["GET"])
def get_emp_id():
    emp_id = session.get("emp_id")
    if emp_id:
        return jsonify({"emp_id": emp_id}), 200
    else:
        return jsonify({"error": "User not logged in"}), 401

VALID_CATEGORIES = {"travel", "medical", "food", "general"} 

@app.route("/add_expense", methods=["POST"])
def add_expense():
    try:
        emp_id = request.form.get("emp_id")
        category = request.form.get("category")
        description = request.form.get("description")
        amount = request.form.get("amount")
        file = request.files.get("proof")

        if not all([emp_id, category, description, amount]):
            return jsonify({"error": "Missing required fields"}), 400

        proof_path = "No File"
        if file:
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
            file.save(file_path)
            proof_path = file_path

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO expense (emp_id, category, description, amount, proof) VALUES (%s, %s, %s, %s, %s) RETURNING exp_id",
            (emp_id, category, description, amount, proof_path)
        )
        exp_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Expense added successfully!", "exp_id": exp_id}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Fetch Expenses (GET)
@app.route("/get_expenses", methods=["GET"])
def get_expenses():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT category, description, amount, proof, status FROM expense")
        expenses = cur.fetchall()
        cur.close()
        conn.close()

        expense_list = [
            {"category": e[0], "description": e[1], "amount": e[2], "proof": e[3], "status": e[4]}
            for e in expenses
        ]
        return jsonify(expense_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_user_info():
    """Fetch user information from the database based on session emp_id"""
    emp_id = session.get('emp_id')
    if not emp_id:
        return None  # No user logged in

    conn = get_db_connection()
    cur = conn.cursor()
    user_info = None

    try:
        cur.execute("SELECT first_name, email, type FROM employee WHERE emp_id = %s", (emp_id,))
        user_data = cur.fetchone()
        if user_data:
            user_info = {
                "name": user_data[0],
                "email": user_data[1],
                "type": user_data[2]
            }
    except Exception as e:
        print("DEBUG - Database Error:", e)
    finally:
        cur.close()
        conn.close()

    return user_info

# @app.route('/announcement')
# def announcement():
#     return render_template('announcement.html')
@app.route('/announcement')
@login_required
def announcement():
    session.permanent = True  
    if "emp_id" not in session:
        return redirect(url_for("signin")) 

    user_info = get_user_info()
    return render_template('announcement.html', user_info=user_info)
    
@app.route('/salary_slip')
def salary_slip():
    return render_template('salary_slip.html')  
  
# contact phone
@app.route('/get_employees', methods=['GET'])
def get_employees():
    conn = get_db_connection()
    cur = conn.cursor()

    # query = """
    # SELECT e.first_name, e.email, e.phone, s.linkedin,  s.twitter
    # FROM employee e
    # LEFT JOIN social s ON e.emp_id = s.emp_id
    # """ 
    query = """
    SELECT e.first_name, e.email, e.phone, s.linkedin, s.twitter, 'employee' AS role 
    FROM employee e
    LEFT JOIN social s ON e.emp_id = s.emp_id
    
    UNION
    
    SELECT a.first_name, a.email, a.phone, NULL AS linkedin, NULL AS twitter, 'admin' AS role 
    FROM admin a
    """
    cur.execute(query)
    employees = cur.fetchall()

    cur.close()
    conn.close()
    employee_list = [
        {
            "first_name": emp[0],
            "email": emp[1],
            "phone": emp[2],
            "linkedin": emp[3],
            # "github": emp[4],
            "twitter": emp[4],
        }
        for emp in employees
    ]
    return jsonify(employee_list)


@app.route('/attendance')
@login_required
def attendance():
    session.permanent = True  
    if "emp_id" not in session:
        return redirect(url_for("signin")) 

    user_info = get_user_info()
    return render_template('attendance.html', user_info=user_info)

def calculate_total_hours(session_data):
    total_minutes = 0
    sorted_sessions = sorted(session_data, key=lambda x: x["checkin"])  # Sort by check-in time

    for session in sorted_sessions:
        if session["checkin"] and session["checkout"]:
            checkin_time = datetime.strptime(session["checkin"], "%H:%M:%S")
            checkout_time = datetime.strptime(session["checkout"], "%H:%M:%S")
            total_minutes += (checkout_time - checkin_time).seconds // 60

    total_hours = f"{total_minutes // 60} hrs {total_minutes % 60} mins"
    return sorted_sessions, total_hours

@app.route('/store-login-time', methods=['POST'])
def store_login():
    emp_id = request.json.get('emp_id')
    checkin_time = request.json.get('checkin_time')
    conn = get_db_connection()
    cur = conn.cursor()
    # Get today's record
    cur.execute("SELECT session_data FROM attendance_records WHERE emp_id = %s AND date = CURRENT_DATE", (emp_id,))
    record = cur.fetchone()

    if record:
        session_data = json.loads(record[0])
    else:
        session_data = []

    session_data.append({"checkin": checkin_time, "checkout": None})

    cur.execute("""
        INSERT INTO attendance_records (emp_id, date, session_data)
        VALUES (%s, CURRENT_DATE, %s)
        ON CONFLICT (emp_id, date) 
        DO UPDATE SET session_data = EXCLUDED.session_data;
    """, (emp_id, json.dumps(session_data)))

    conn.commit()
    return jsonify({"message": "Check-in stored!"})

@app.route('/store-logout-time', methods=['POST'])
def store_logout():
    emp_id = request.json.get('emp_id')
    logout_time = request.json.get('logout_time')
    conn = get_db_connection()
    cur = conn.cursor()

    # Get today's record
    cur.execute("SELECT session_data FROM attendance_records WHERE emp_id = %s AND date = CURRENT_DATE", (emp_id,))
    record = cur.fetchone()

    if not record:
        return jsonify({"error": "No check-in found for today!"}), 400

    session_data = json.loads(record[0])

    # Update the last session
    for session in reversed(session_data):
        if session["checkout"] is None:
            session["checkout"] = logout_time
            break

    cur.execute("UPDATE attendance_records SET session_data = %s WHERE emp_id = %s AND date = CURRENT_DATE",
                   (json.dumps(session_data), emp_id))
    
    conn.commit()
    return jsonify({"message": "Check-out stored!"})

@app.route('/fetch-attendance', methods=['GET'])
def fetch_attendance():
    try:
        if 'emp_id' not in session:
            return jsonify([])  # Always return an empty list if no session

        emp_id = session['emp_id']
        conn = get_db_connection()
        cur = conn.cursor()

        # Fetch attendance records using correct column names
        cur.execute("SELECT date, checkin, checkout FROM logs WHERE emp_id = %s ORDER BY date DESC LIMIT 2", (emp_id,))
        records = cur.fetchall()

        cur.close()
        conn.close()

        # Convert records into JSON serializable format
        attendance_data = []
        for row in records:
            date = row[0].strftime('%Y-%m-%d') if row[0] else "-"
            checkin = row[1].strftime('%H:%M:%S') if row[1] else "-"
            checkout = row[2].strftime('%H:%M:%S') if row[2] else "-"

            attendance_data.append({
                "date": date,
                "checkin": checkin,  # Renamed from login_time
                "checkout": checkout  # Renamed from logout_time
            })

        print("Fetched Attendance Data:", attendance_data)  # Debugging
        return jsonify(attendance_data)

    except Exception as e:
        print("Error fetching attendance:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route('/select-meal', methods=['POST'])
def select_meal():
    try:
        data = request.json
        emp_id = session.get("emp_id")
        meal_choice = data.get("meal")  # Expecting 'Yes' or 'No'

        if not emp_id:
            return jsonify({"error": "User not authenticated"}), 401

        today_date = datetime.date.today()

        # Log data for debugging
        print(f"Meal Selection Request: emp_id={emp_id}, meal_choice={meal_choice}, date={today_date}")

        # Store meal selection in the frontend table only (not DB yet)
        return jsonify({"message": "Meal selection recorded in frontend", "meal": meal_choice}), 200

    except Exception as e:
        print(f"Error: {e}")  # Log error to Flask console
        return jsonify({"error": str(e)}), 500

@app.route('/submit-attendance', methods=['POST'])
def submit_attendance():
    try:
        data = request.json
        emp_id = session.get("emp_id")
        meal_choice = data.get("meal")  # Expecting 'Yes' or 'No'
        today_date = datetime.date.today()

        # if not emp_id:
        #     return jsonify({"error": "User not authenticated"}), 401

        # Connect to DB
        conn = psycopg2.connect("dbname=yourdb user=youruser password=yourpassword")
        cur = conn.cursor()

        # Store data in DB
        cur.execute("INSERT INTO record (emp_id, date, meal, status) "
                    "VALUES (%s, %s, %s, %s)", 
                    (emp_id, today_date, meal_choice, "pending"))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Attendance submitted successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/store-meal', methods=['POST'])
def store_meal():
    if 'emp_id' not in session:
        return jsonify({"error": "User not signed in"}), 403

    emp_id = session['emp_id']
    data = request.json
    meal = data.get('meal')
    today = date.today().strftime('%Y-%m-%d')

    if not meal:
        return jsonify({"error": "Meal selection is required"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Insert data into the `record` table
        cur.execute(
            "INSERT INTO record (emp_id, date, meal, status, type) VALUES (%s, %s, %s, %s, %s)",
            (emp_id, today, meal, "pending", "pending")
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Meal data stored successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/fetch-today-records', methods=['GET'])
def fetch_today_records():
    if 'emp_id' not in session:
        return jsonify({"error": "User not signed in"}), 403

    emp_id = session['emp_id']
    today = date.today().strftime('%Y-%m-%d')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT date, meal, status, type FROM record WHERE emp_id = %s AND date = %s", (emp_id, today))
        records = cur.fetchall()
        
        conn.close()  # Close connection after fetching
        
        return jsonify([{
            "date": row[0],
            "meal": row[1],
            "status": row[2],
            "type": row[3]
        } for row in records])

    except Exception as e:
        print("Database Error:", e)  # Log error
        return jsonify({"error": str(e)}), 500 


@app.route('/logout', methods=['POST'])
@login_required
def logout():
    if 'emp_id' not in session:
        return jsonify({"success": False, "message": "User not logged in"}), 401

    emp_id = session['emp_id']
    now = datetime.now().strftime('%H:%M:%S')
    today = datetime.now().date()

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # ✅ Ensure logout is stored in the same row as the login entry
        cur.execute("""
            UPDATE logs
            SET checkout = %s
            WHERE emp_id = %s AND date = %s AND checkout IS NULL
        """, (now, emp_id, today))

        conn.commit()
        cur.close()
        conn.close()

        # Clear session after storing logout time
        session.clear()

        return jsonify({"success": True, "message": "Logged out successfully!", "logout_time": now}), 200
        logout_user()
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
    
@app.route("/admin_dashboard", methods=["GET"])
def admin_dashboard():
    return render_template("admin_dashboard.html")


@app.route("/admin_employee", methods=["GET"])
def admin_employee():
    return render_template("admin_employee.html")

@app.route("/fetch_employee_list", methods=["GET"])
def fetch_employee_list():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Unable to connect to the database."}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT first_name,last_name, emp_id, photo, category FROM employee")
        employees = cursor.fetchall()
        conn.close()

        # Convert result to a list of dictionaries
        employee_list = [
            {
                 "first_name": emp[0],
                "last_name": emp[1],
                "emp_id": emp[2],
                "photo": emp[3],
                "category": emp[4],
            }
            for emp in employees
        ]
        
        return jsonify(employee_list)

    except Exception as e:
        conn.close()
        return jsonify({"error": f"Error fetching employee data: {e}"}), 500


@app.route('/get_employee_data', methods=['POST'])
def get_employee_data():
    try:
        data = request.get_json()

        if not data or "EMP_ID" not in data:
            return jsonify({"error": "EMP_ID is required"}), 400

        emp_id = data["EMP_ID"]

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT first_name, last_name, emp_id, photo, date_of_birth, email, address, phone, emergency_number, gender, category FROM employee WHERE emp_id = %s", (emp_id,))
        personal_data = cur.fetchone()
        
        # Fetch financial details from financial_detail table
        cur.execute("SELECT bank_name, account_number, ifsc_code, account_name, bank_address, pincode FROM financial_detail WHERE emp_id = %s", (emp_id,))
        financial_data = cur.fetchone()
        
        # Fetch skills and interests from skillsandinterest table
        cur.execute("SELECT skills,  soft_skills, interests FROM skillsandinterest WHERE emp_id = %s", (emp_id,))
        skills_data = cur.fetchone()
        
        # Fetch social links from social table
        cur.execute("SELECT linkedin, github, twitter FROM social WHERE emp_id = %s", (emp_id,))
        social_data = cur.fetchone()

        cur.close()
        conn.close()
        response = {
            "personal": {
                "name": f"{personal_data[0]} {personal_data[1]}",
                "emp_id": personal_data[2],
                "photo": personal_data[3],
                "date_of_birth": personal_data[4],
                "email": personal_data[5],
                "address": personal_data[6],
                "phone": personal_data[7],
                "emergency_number": personal_data[8],
                "gender": personal_data[9],
                "category": personal_data[10]
            } if personal_data else "No Data",
            "financial": {
                "bank_name": financial_data[0],
                "account_number": financial_data[1],
                "ifsc_code": financial_data[2],
                "account_name": financial_data[3],
                "bank_address": financial_data[4],
                "pincode": financial_data[5]
            } if financial_data else "No Data",
            "skills": {
                "skills": skills_data[0],
                # "certifications": skills_data[1],
                "soft_skills": skills_data[1],
                "interests": skills_data[2]
            } if skills_data else "No Data",
            "social": {
                "linkedin": social_data[0],
                "github": social_data[1],
                "twitter": social_data[2]
            } if social_data else "No Data"
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/admin_leave')
def admin_leave():
    return render_template('admin_leave.html')

@app.route('/get_leave_requests')
def get_leave_requests():
    conn = get_db_connection()

    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500 # Return error JSON

    try:
        cursor = conn.cursor()
        query = """
        SELECT la.leave_id, la.emp_id, e.first_name || ' ' || e.last_name AS name,
               la.reason, la.document_path, la.start_date, la.end_date, la.status
        FROM leave_applications la
        JOIN employee e ON la.emp_id = e.emp_id;
        """
        cursor.execute(query)
        leave_requests = cursor.fetchall()
        cursor.close()
        conn.close()
        leave_data = [
            {
                "leave_id": row[0], # Leave ID
                "id": row[1], # Employee ID
                "name": row[2], # Full Name
                "reason": row[3], # Leave Reason
                "doc": row[4] if row[4] else "", # Document Link (handle NULL values)
                "fromDate": row[5].strftime('%Y-%m-%d') if row[5] else "", # Start Date
                "toDate": row[6].strftime('%Y-%m-%d') if row[6] else "", # End Date
                "status": row[7].lower() if row[7] else "pending", # Status (handle NULL values)
                "editable": False
            }
            for row in leave_requests
        ]
        return jsonify(leave_data)
    except Exception as e:
        print("Error fetching leave requests:", e)
        return jsonify({"error": "Failed to fetch leave requests"}), 500 # Return JSON error message


@app.route("/update_leave_status", methods=["POST"])
def update_leave_status():
    conn = get_db_connection() # Get database connection
    cur = conn.cursor() # Create cursor
    try:
        data = request.json
        leave_id = data.get("leave_id")
        new_status = data.get("status")
        if not leave_id or not new_status:
            return jsonify({"success": False, "message": "Missing data!"}), 400
        cur.execute("UPDATE leave_applications SET status = %s WHERE leave_id = %s", (new_status, leave_id))
        conn.commit()
        return jsonify({"success": True, "message": f"Leave {new_status}!"})
    except Exception as e:
        print("Error:", str(e)) # Print error for debugging
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cur.close() # Close cursor
        conn.close() # Close connection

@app.route('/admin_attendance')
def admin_attendance():
    return render_template('admin_attendance.html')

@app.route('/fetch_attendance_records')
def fetch_attendance_records():
    conn = get_db_connection()
    cursor = conn.cursor()

    today = datetime.now().date()

    cursor.execute("""
        SELECT record.date, employee.first_name, record.meal, record.type, record.status
        FROM record
        JOIN employee ON record.emp_id = employee.emp_id
        WHERE record.date = %s
    """, (today,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    attendance_data = [
        {
            'date': row[0],
            'employee': row[1],
            'meal': row[2],
            'type': row[3],
            'status': row[4]
        }
        for row in data
    ]
    return jsonify(attendance_data)

# Fetch yesterday's check-in data
@app.route('/fetch_checkin_data')
def fetch_checkin_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    yesterday = (datetime.now() - timedelta(days=1)).date()

    cursor.execute("""
        SELECT logs.date, employee.first_name, logs.checkin, logs.checkout, logs.total_hours
        FROM logs
        JOIN employee ON logs.emp_id = employee.emp_id
        WHERE logs.date = %s
    """, (yesterday,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    checkin_data = []
    for row in data:
        total_hours = row[4]
        if total_hours:  # Convert timedelta to HH:MM:SS
            seconds = int(total_hours.total_seconds())
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            seconds = seconds % 60
            total_hours_str = f"{hours:02}:{minutes:02}:{seconds:02}"
        else:
            total_hours_str = None

        checkin_data.append({
            'date': row[0],
            'employee': row[1],
            'checkIn': row[2].strftime('%H:%M:%S') if row[2] else None,
            'checkOut': row[3].strftime('%H:%M:%S') if row[3] else None,
            'totalHours': total_hours_str
        })

    return jsonify(checkin_data)

# Fetch all employee names for dropdown
@app.route('/fetch_employee_names')
def fetch_employee_names():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT first_name FROM employee ORDER BY first_name ASC")
    employees = cursor.fetchall()

    cursor.close()
    conn.close()

    employee_list = [row[0] for row in employees]
    return jsonify(employee_list)

@app.route('/fetch_employee_history/<employee_name>')
def fetch_employee_history(employee_name):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT logs.date, logs.checkin, logs.checkout, logs.total_hours, 
               record.meal, record.type, record.status
        FROM logs
        LEFT JOIN record ON logs.emp_id = record.emp_id AND logs.date = record.date
        JOIN employee ON logs.emp_id = employee.emp_id
        WHERE employee.first_name = %s
        ORDER BY logs.date ASC
    """, (employee_name,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    employee_history = []
    for row in data:
        total_hours = row[3]
        if total_hours:  # Convert timedelta to HH:MM:SS
            seconds = int(total_hours.total_seconds())
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            seconds = seconds % 60
            total_hours_str = f"{hours:02}:{minutes:02}:{seconds:02}"
        else:
            total_hours_str = None

        employee_history.append({
            'date': row[0],
            'checkIn': row[1].strftime('%H:%M:%S') if row[1] else None,
            'checkOut': row[2].strftime('%H:%M:%S') if row[2] else None,
            'totalHours': total_hours_str,
            'meal': row[4],
            'type': row[5],
            'status': row[6]
        })

    return jsonify(employee_history)

@app.route('/update_attendance_status', methods=['POST'])
def update_attendance_status():
    data = request.json
    date = data.get('date')
    employee = data.get('employee')
    status = data.get('status')
    type_ = data.get('type', 'full day')  # Default "full day" if not provided
    conn = get_db_connection()
    cursor = conn.cursor()
    # Update attendance in database
    cur = conn.cursor()
    cur.execute("""
        UPDATE attendance 
        SET status = %s, type = %s 
        WHERE date = %s AND emp_id = (SELECT emp_id FROM employee WHERE name = %s)
    """, (status, type_, date, employee))
    
    conn.commit()
    cur.close()
    return jsonify({"message": "Attendance updated successfully"})

@app.route('/submit_attendance_data', methods=['POST'])
def submit_attendance_data():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    for record in data:
        # Fetch all employee IDs for the given first_name
        cursor.execute("SELECT emp_id FROM employee WHERE first_name = %s", (record['employee'],))
        emp_ids = cursor.fetchall()  # This returns a list of tuples [(1,), (2,)...]

        if not emp_ids:
            continue  # Skip if no employee found

        for emp_id_tuple in emp_ids:
            emp_id = emp_id_tuple[0]
            cursor.execute("""
                UPDATE record
                SET status = %s, type = %s
                WHERE date = %s AND emp_id = %s
            """, (record['status'], record.get('type', 'full day'), record['date'], emp_id))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Attendance records submitted successfully"}), 200


@app.route('/admin_expense')
def admin_expense():
    return render_template('admin_expense.html')

@app.route('/fetch_expenses', methods=['GET'])
def fetch_expenses():
    conn = get_db_connection()
    cur = conn.cursor()

    query = """
        SELECT e.exp_id, emp.first_name, e.category, e.description, e.amount, e.proof, e.status
        FROM expense e
        JOIN employee emp ON e.emp_id = emp.emp_id
    """
    cur.execute(query)
    
    expenses = [
        {
            "id": row[0], "employee": row[1], "category": row[2], 
            "description": row[3], "amount": row[4], "proof": row[5] if row[5] else "", 
            "status": row[6]  # Fetch status from DB
        }
        for row in cur.fetchall()
    ]
    
    cur.close()
    conn.close()
    return jsonify(expenses)

@app.route('/update_expense_status', methods=['POST'])
def update_expense_status():
    try:
        data = request.get_json()
        exp_id = data.get("exp_id")
        status = data.get("status")

        if not exp_id or not status:
            return jsonify({"error": "Missing required fields"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("UPDATE expense SET status = %s WHERE exp_id = %s", (status, exp_id))
        conn.commit()

        cur.close()
        conn.close()
        return jsonify({"message": "Expense status updated successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/admin_announcement')
def admin_announcement():
    return render_template('admin_announcement.html')

# @app.route('/admin_payroll')
# def admin_payroll():
#     return render_template('admin_payroll.html')

@app.route('/admin_contact')
def admin_contact():
    return render_template('admin_contact.html')
def get_user_role():
    user_id = session.get('user_id')  # Session se user ID nikalo
    if not user_id:
        return "guest"

    # Database connection
    conn = psycopg2.connect("dbname=yourdb user=youruser password=yourpass")
    cur = conn.cursor()

    # Fetch role from database
    cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
    role = cur.fetchone()

    cur.close()
    conn.close()

    return role[0] if role else "guest"

@app.route('/supadmin_dashboard')
def supadmin_dashboard():
    user_role = get_user_role()  # Fetch role from DB

    session.permanent = True  # Keep session active

    # ✅ Superadmin authentication check
    if "superadmin_id" not in session or session.get("role") != "superadmin":
        return redirect(url_for("signin"))  # Redirect to signin page if not logged in

    return render_template('supadmin_dashboard.html', role=user_role)

@app.route('/superadmin_photo')
def superadmin_photo():
    if "superadmin_id" not in session:
        print("DEBUG: No superadmin_id in session")
        return send_default_photo()

    superadmin_id = session["superadmin_id"]
    print(f"DEBUG: Fetching photo for superadmin_id {superadmin_id}")

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # ✅ Fetch photo path from DB
        cur.execute("SELECT photo FROM superadmin WHERE spadmin_id = %s", (superadmin_id,))
        result = cur.fetchone()

        if result and result[0]:  
            # ✅ Fix the path issue
            photo_path = os.path.join("static", result[0])  

            # ✅ Ensure file exists
            if os.path.exists(photo_path):  
                return send_file(photo_path, mimetype='image/jpeg')  

            print(f"DEBUG: Photo file not found - {photo_path}")

        return send_default_photo()

    except Exception as e:
        print(f"DEBUG: Error fetching superadmin photo - {e}")
        return send_default_photo()

    finally:
        cur.close()
        conn.close()

def send_default_photo():
    default_photo_path = "static/default_profile.jpeg"
    
    if not os.path.exists(default_photo_path):
        print("ERROR: Default profile image is missing!")
        return "Default image not found", 404  # Return HTTP 404 if the image is missing
    
    return send_file(default_photo_path, mimetype='image/png')

@app.route('/supadmin_attendance')
def supadmin_attendance():
    return render_template('supadmin_attendance.html')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')







 