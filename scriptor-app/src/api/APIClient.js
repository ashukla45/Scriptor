import querystring from "./utils";

class APIClient {
    constructor() {
        this.state = {
            authToken: localStorage.getItem("authToken")
        };
        this.callbacks = [];
    }

    addCallback(cb) {
        this.callbacks.push(cb);
    }

    notifyCallbacks(message) {
        for (var i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](message);
        }
    }

    setAuthToken(authToken) {
        localStorage.setItem("authToken", authToken);
        this.state.authToken = authToken;
    }

    clearAuthToken() {
        this.state.authToken = null;
        localStorage.removeItem("authToken")
    }

    getAuthToken() {
        return this.state.authToken;
    }

    isCurrentUserLoggedIn() {
        return this.getAuthToken() != null;
    }

    _getRequestHeaders() {
        if (!this.isCurrentUserLoggedIn())
            return {'Content-Type': 'application/json'};
        else
            return {"Authorization": "Bearer " + this.getAuthToken(), 'Content-Type': 'application/json'}
    }

    /** User-based functions **/
    getCurrentUser() {
        if (!this.isCurrentUserLoggedIn())
            return null;

        return new Promise((resolve, reject) => {
            fetch("/api/user/me/", {headers: this._getRequestHeaders()}).then(response => response.json()).then((response) => {
                if (response.success)
                    resolve(response.current_user);
                else
                    reject(response.error);
            })
        });
    }

    // Implemented
    login(email, password) {
        return new Promise((resolve, reject) => {
            fetch("/api/user/login/", {
                method: 'POST',
                headers: this._getRequestHeaders(),
                body: JSON.stringify({"email": email, "password": password})
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        this.setAuthToken(response.auth_token);
                        this.notifyCallbacks({type: "auth", action: "login"});
                        resolve(response.auth_token);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    // Implemented
    logout() {
        this.clearAuthToken();
        this.notifyCallbacks({type: "auth", action: "logout"});
    }

    // Implemented
    register(email, password) {
        return new Promise((resolve, reject) => {
            fetch("/api/user/register/", {
                method: 'POST',
                headers: this._getRequestHeaders(),
                body: JSON.stringify({"email": email, "password": password})
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        this.setAuthToken(response.auth_token);
                        this.notifyCallbacks({type: "auth", action: "login"});
                        resolve(response.auth_token);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    // Implemented
    changePassword(existingPassword, newPassword) {
        return new Promise((resolve, reject) => {
            fetch("/api/user/change_password/", {
                method: 'POST',
                headers: this._getRequestHeaders(),
                body: JSON.stringify({"existing_password": existingPassword, "new_password": newPassword})
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(true);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    sendPasswordTokenEmail(userEmail) {
        return new Promise((resolve, reject) => {
            fetch("/api/user/send_password_recovery_email/", {
                method: 'POST',
                headers: this._getRequestHeaders(),
                body: JSON.stringify({"email": userEmail})
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(true);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    setNewPassword(userEmail, newPassword, passwordToken) {
        return new Promise((resolve, reject) => {
            fetch("/api/user/set_new_password/", {
                method: 'POST',
                headers: this._getRequestHeaders(),
                body: JSON.stringify({"email": userEmail, "password_token": passwordToken, "new_password": newPassword})
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(true);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    // Implemented
    addFavoritePodcastById(podcastId) {
        return new Promise((resolve, reject) => {
            fetch("/api/user/favorite_podcasts/" + podcastId + "/add/", {
                method: 'POST',
                headers: this._getRequestHeaders()
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(true);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    // Implemented
    checkFavoritePodcast(podcastId) {
        return new Promise((resolve, reject) => {
            fetch("/api/user/favorite_podcasts/" + podcastId + "/check/", {
                headers: this._getRequestHeaders()
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response.has_favorited_podcast);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    // Implemented
    removeFavoritePodcastById(podcastId) {
        return new Promise((resolve, reject) => {
            fetch("/api/user/favorite_podcasts/" + podcastId + "/remove/", {
                method: 'DELETE',
                headers: this._getRequestHeaders()
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(true);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    getFavoritePodcasts() {
        return new Promise((resolve, reject) => {
            fetch("/api/user/favorite_podcasts/", {headers: this._getRequestHeaders()}).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response.favorite_podcasts);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    getHistory() {
        return new Promise((resolve, reject) => {
            fetch("/api/user/history/", {headers: this._getRequestHeaders()}).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response.history);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    clearHistory() {
        return new Promise((resolve, reject) => {
            fetch("/api/user/history/clear/", {
                method: "DELETE",
                headers: this._getRequestHeaders()
            }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(true);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }


    /** Search-based functions **/
    // Implemented unfiltered search to toast
    searchPodcasts(text_query, filters) {
        var url_query = filters;
        url_query.q = text_query;
        var queryString = querystring(url_query);
        return new Promise((resolve, reject) => {
            fetch("/api/search/podcasts/" + queryString, {headers: this._getRequestHeaders()}).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response.results);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    /* Auxiliary search methods for input autocomplete */
    searchDepartments(query) {
        var queryString = querystring({q: query});
        return new Promise((resolve, reject) => {
            fetch("/api/search/departments/" + queryString, {headers: this._getRequestHeaders()}).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response.results);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    searchProfessors(query) {
        var queryString = querystring({q: query});
        return new Promise((resolve, reject) => {
            fetch("/api/search/professors/" + queryString, {headers: this._getRequestHeaders()}).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response.results);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    searchQuarters(query) {
        var queryString = querystring({q: query});
        return new Promise((resolve, reject) => {
            fetch("/api/search/quarters/" + queryString, {headers: this._getRequestHeaders()}).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response.results);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    /** Podcast-based functions **/
    getPodcastSnippet(blobId) {
        return new Promise((resolve, reject) => {
            fetch("/api/podcasts/blobs/" + blobId + "/", {headers: this._getRequestHeaders()}).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve({podcast: response.podcast, podcast_blob: response.podcast_blob});
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    getPodcastMetadata(podcastId) {
        return new Promise((resolve, reject) => {
            fetch("/api/podcasts/" + podcastId + "/", {headers: this._getRequestHeaders()}).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response.podcast);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }

    getPodcastTranscript(podcastId, sentence_split = 5) {
        return new Promise((resolve, reject) => {
            fetch("/api/podcasts/" + podcastId + "/transcript/?sentence_split=" + sentence_split,
                {
                    headers: this._getRequestHeaders(),
                }).then(response => response.json())
                .then((response) => {
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(response.error);
                    }
                })
        });
    }
}

export default new APIClient();