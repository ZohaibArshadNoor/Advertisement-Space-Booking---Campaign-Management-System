from app import create_app


# Create the Flask application using our application factory.
app = create_app()


if __name__ == "__main__":
    # Start Flask's development server.
    #
    # debug=True automatically reloads the server when
    # Python files are changed during development.
    app.run(debug=True)