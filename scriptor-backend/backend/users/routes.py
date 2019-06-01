from flask import Blueprint, request, jsonify, g

from backend.users.models import User
from backend.users.validation import is_email_valid, is_password_valid
from backend.utils import login_required

users_blueprint = Blueprint('users', __name__, url_prefix="/api/user")


@users_blueprint.route("/me/")
@login_required
def get_current_user():
    current_user = g.current_user.to_dict()
    return jsonify(success=True, current_user=current_user)


@users_blueprint.route('/register/', methods=['POST'])
def user_register():
    """
    This route handles user registration.

    Pre-conditions:
    - The POST request should contain the user's (valid) email and password.

    Post-conditions:
    - This route will create the user's account & return an authentication token
      that the front-end should include in all future requests
      (in order to authenticate the user in the backend).

    Sample responses:

    success (HTTP status 200):
    {
        "success" : true,
        "auth_token" : "<some auth token>"
    }

    failure (HTTP status 400):
    {
        "success" : false,
        "error" : "<some error message>"
    }

    :return:    A JSON response with the user's auth token
    """
    data = request.get_json(force=True)
    email = data['email']
    password = data['password']

    # Check if the email is valid.
    if not is_email_valid(email=email):
        return jsonify(success=False, error="Invalid email."), 400

    # Check if the password is valid.
    if not is_password_valid(password=password):
        return jsonify(success=False, error="Invalid password."), 400

    # We have a valid email & password, so let's register a new user.
    try:
        new_user = User.register_new_user(email=email, password=password)

        # Generate an auth token for this new user
        auth_token = new_user.generate_auth_token()

        return jsonify(success=True, auth_token=auth_token)
    except ValueError as e:
        return jsonify(success=False, error=str(e)), 400


@users_blueprint.route('/login/', methods=['POST'])
def user_login():
    """
    This route handles user login.

    Pre-conditions:
    - A POST request with the provided email & password

    Post-conditions:
    - success: The auth token for the front-end to use for the user
    - failure: an error message

    Sample responses:

    success (HTTP status 200):
    {
        "success" : true,
        "auth_token" : "<auth token goes here>"
    }

    failure (HTTP status 400):
    {
        "success" : false,
        "error" : "Invalid email or password."
    }

    :return:    A JSON response with the user's auth token
    """
    data = request.get_json(force=True)
    email = data['email']
    password = data['password']

    try:
        logged_in_user = User.get_by_login_credentials(email=email, password=password)
    except ValueError as e:
        return jsonify(success=False, error=str(e)), 400

    auth_token = logged_in_user.generate_auth_token()
    return jsonify(success=True, auth_token=auth_token)


@users_blueprint.route("/change_password/", methods=['POST'])
@login_required
def user_change_password():
    """
    This route handles the user's password change.

    Pre-conditions:
    - The POST request must provide a valid existing password & new password

    Post-conditions:
    - The user's password will be changed.

    Sample responses:

    success (HTTP status 200):
    {
        "success" : true
    }

    failure (HTTP status 400):
    {
        "success" : false,
        "error" : "<error message>"
    }
    :return:    A JSON response indicating whether or not the user's password was successfully changed.
    """
    data = request.get_json(force=True)
    existing_password = data['existing_password']
    new_password = data['new_password']

    try:
        g.current_user.change_password(existing_password=existing_password, new_password=new_password)
        return jsonify(success=True)
    except ValueError as e:
        return jsonify(success=False, error=str(e)), 400


@users_blueprint.route("/favorite_podcasts/<string:podcast_id>/<string:blob_id>/check/")
@login_required
def user_check_favorite_podcast(podcast_id, blob_id):
    has_favorited_podcast = g.current_user.has_favorited(podcast_id, blob_id)
    return jsonify(success=True, has_favorited_podcast=has_favorited_podcast)


@users_blueprint.route("/favorite_podcasts/<string:podcast_id>/<string:blob_id>/add/", methods=['POST'])
@login_required
def user_add_favorite_podcast(podcast_id, blob_id):
    """
    This will add a podcast id to the user's favorite podcast list (if it's not already in the list)

    Preconditions:
    - The POST request must provide a valid podcast id in the URL

    Post conditions:
    - The podcast will be added to the user's favorite list (if it's not already there)

    Sample responses:

    success (HTTP status 200):
    {
        "success" : true
    }

    :param podcast_id:  The id of the favorite podcast to add
    :param blob_id:     The id of the favorite blob to add
    :return: A JSON response indicating whether the request was successful
    """
    g.current_user.add_favorite_podcast(podcast_id=podcast_id, blob_id=blob_id)
    return jsonify(success=True)


@users_blueprint.route("/favorite_podcasts/<string:podcast_id>/<string:blob_id>/remove/", methods=['DELETE'])
@login_required
def user_remove_favorite_podcast(podcast_id, blob_id):
    """
    This will delete a podcast id from the user's favorite podcast list (if it's already in the list)

    Preconditions:
    - The DELETE request must provide a valid podcast id in the URL

    Post conditions:
    - The podcast will be removed from the user's favorite list (if it's not already there)

    Sample responses:

    success (HTTP status 200):
    {
        "success" : true
    }

    :param podcast_id:  The id of the favorite podcast to remove
    :param podcast_id:  The id of the favorite podcast blob to remove
    :return: A JSON response indicating whether the request was successful
    """
    g.current_user.remove_favorite_podcast(podcast_id_to_remove=podcast_id, blob_id_to_remove=blob_id)
    return jsonify(success=True)


@users_blueprint.route("/favorite_podcasts/", methods=['GET'])
@login_required
def user_get_favorite_podcasts():
    """
    This will return the user's list of favorite podcasts.

    Sample responses:

    success (HTTP status 200):
    {
        "success" : true,
        "favorite_podcasts" : [
            {"favorite_podcast" : <Podcast json object>, "favorite_blob" : <PodcastTranscriptionBlob json object>}
            ...
        ]
    }
    :return:
    """
    favorites = []
    for fav_blob in g.current_user.favorite_podcast_blobs:
        favorites.append(
            {"favorite_blob": fav_blob.convert_to_dict(), "favorite_podcast": fav_blob.podcast.convert_to_dict()})
    return jsonify(success=True, favorites=favorites)


@users_blueprint.route("/history/", methods=['GET'])
@login_required
def user_get_history():
    """
    This will return the user's history.

    Sample responses:

    success (HTTP status 200):
    {
        "success" : true,
        "history" : [
            <HistoryItem json object>,
            <HistoryItem json object>,
            ...
        ]
    }
    """
    page = int(request.args.get("page", 1))
    count = int(request.args.get("count", 10))
    history_items = list(reversed(g.current_user.history))[(page - 1) * count: ((page - 1) * count) + count]
    history_items = [item.convert_to_dict() for item in history_items]
    return jsonify(success=True, history=history_items)


@users_blueprint.route("/send_password_recovery_email/", methods=["POST"])
def user_send_password_recovery_email():
    data = request.get_json(force=True)
    email = data['email']

    try:
        user = User.find_by_email(email)
    except ValueError as e:
        return jsonify(success=False, error=str(e)), 400

    try:
        user.send_forgot_password_email()
        return jsonify(success=True)
    except Exception:
        return jsonify(success=False, error="The password recovery email could not be sent."), 400


@users_blueprint.route("/set_new_password/", methods=['POST'])
def user_set_new_password():
    data = request.get_json(force=True)
    password_token = data['password_token']
    email = data['email']

    try:
        user = User.find_by_email(email)
    except ValueError as e:
        return jsonify(success=False, error=str(e)), 400

    if not user.verify_password_token(password_token):
        return jsonify(success=False, error="Invalid password verification token."), 400

    new_password = data['new_password']
    try:
        user.set_password(new_password)
    except Exception as e:
        return jsonify(success=False, error=str(e)), 400

    return jsonify(success=True)

@users_blueprint.route("/history/clear/", methods=["DELETE"])
@login_required
def user_clear_history():
    """
    This will clear the user's history.

    Sample responses:

    success (HTTP status 200):
    {
        "success" : true
    }
    """
    g.current_user.clear_history()
    return jsonify(success=True)
