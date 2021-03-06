import React, {Component} from 'react';
import {toast} from 'react-toastify';
import './PodcastPage.css';
import APIClient from './api/APIClient.js';
import queryString from 'query-string';
import {Link} from 'react-router-dom';

class PodcastPage extends Component {
    values = queryString.parse(this.props.location.search);
    state = {
        isFavorited: false,
        podcast: null,
        podcast_blob: null
    };

    formatTitle() {
        // Add department and coursenum
        let fulltitle = this.state.podcast.department + ' ' + this.state.podcast.course_num;

        // Add truncated coursename
        var coursename = this.state.podcast.title;
        if (coursename.length > 25) {
            coursename = coursename.substring(0, 25) + '...';
        }
        fulltitle += ' - ' + coursename;

        // Add section id
        fulltitle += ' [' + this.state.podcast.section_id + ']';

        // Add truncated professor
        var professor = this.state.podcast.professor;
        // Swaps first and last name
        professor = professor.substring(professor.indexOf(',') + 1, professor.length) + " " +
        professor.substring(0, professor.indexOf(','));
        if (professor.length > 12) {
            professor = professor.substring(0, 12) + '...';
        }
        fulltitle += ' | ' + professor;

        // Add lecturenum
        fulltitle += ' | Lecture ' + this.state.podcast.lecture_num;

        return fulltitle;
    }

    formatVideoLink(mainurl) {
        return (mainurl + '#t=' + this.state.podcast_blob.starting_timestamp_second);
    }

    formatRelevantText() {
        if (this.state.podcast_blob.transcription_blob.length > 950) {
            return this.state.podcast_blob.transcription_blob.substring(0, 950) + '...';
        }
        return this.state.podcast_blob.transcription_blob;
    }

    onSubmit(e) {
        e.preventDefault();
        if (!APIClient.isCurrentUserLoggedIn()) {
            toast("Log In to Favorite", {className: 'popup error'});
            return;
        }

        APIClient.checkFavoritePodcast(this.state.podcast.id, this.state.podcast_blob.id).then(response => {
            if (response) {
                APIClient.removeFavoritePodcastById(this.state.podcast.id, this.state.podcast_blob.id).then(response => {
                    toast("Removed from Favorites", {className: 'popup'});
                });
                this.setState({isFavorited: false});
                document.getElementById('togglebutton').style.color = "rgba(255,255,255,1)";
                document.getElementById('togglebutton').style.border = "none";
                document.getElementById('togglebutton').style.backgroundColor = "rgba(72,136,163,.93)";
                document.getElementById('togglebutton').innerHTML = "FAVORITE";
            } else {
                APIClient.addFavoritePodcastById(this.state.podcast.id, this.state.podcast_blob.id).then(response => {
                    toast("Added to Favorites", {className: 'popup'});
                });
                this.setState({isFavorited: true});
                document.getElementById('togglebutton').style.color = "rgba(72,136,163,.93)";
                document.getElementById('togglebutton').style.border = "1px solid rgba(72,136,163,.93)";
                document.getElementById('togglebutton').style.backgroundColor = "rgba(255,255,255,1)";
                document.getElementById('togglebutton').innerHTML = "UNFAVORITE";
            }
        });

    }

    relocate(e, mainurl) {
        e.preventDefault();
        window.location.assign(mainurl + '#t=' + this.state.podcast_blob.starting_timestamp_second);
    }

    componentDidMount() {
        if (performance.navigation.type === 2) {
            window.location.reload();
        }

        APIClient.getPodcastSnippet(this.values.blob_id).then(res => {
            this.setState({podcast: res.podcast, podcast_blob: res.podcast_blob});


            APIClient.checkFavoritePodcast(res.podcast.id, res.podcast_blob.id).then(response => {
                if (response) {
                    this.setState({isFavorited: true});
                    document.getElementById('togglebutton').style.color = "rgba(72,136,163,.93)";
                    document.getElementById('togglebutton').style.border = "1px solid rgba(72,136,163,.93)";
                    document.getElementById('togglebutton').style.backgroundColor = "rgba(255,255,255,1)";
                    document.getElementById('togglebutton').innerHTML = "UNFAVORITE";
                } else {
                    this.setState({isFavorited: false});
                }
            });

        });
    }

    render() {
        if (!this.state.podcast || !this.state.podcast_blob) {
            // The podcast and podcast blob info haven't been loaded yet.
            return (<div></div>);
        } else {
            let mainurl = (this.values.ucsd_podcast_video_url === '') ? this.state.podcast.ucsd_podcast_audio_url : this.state.podcast.ucsd_podcast_video_url;
            return (
                <div className='podpage'>
                    <h1 className='title'><a className='link' href={mainurl + '#t=' + this.state.podcast_blob.starting_timestamp_second}>{this.formatTitle()}</a></h1>
                    <div className='toplayer'>
                        <video className='vid' controls autoPlay>
                            <source src={this.formatVideoLink(mainurl)}/>
                        </video>
                        <div className='text'>
                            <h3>Speech-to-Text</h3>
                            <p style={{marginTop: '22px'}}>{this.formatRelevantText()}</p>
                            <Link
                                className='link'
                                to={{
                                    pathname: "/transcript",
                                    search: "?podcast_id=" + this.state.podcast.id
                                }}
                            ><u>View Full Transcript</u></Link>
                        </div>
                    </div>
                    <div className="btn-group pagewide fullgroup">
                        <div className="btn-group pagewide">
                            <button type="button" className="btn" id='togglebutton'
                                    onClick={e => this.onSubmit(e)}>FAVORITE
                            </button>
                        </div>
                        <div className="btn-group pagewide">
                            <button type="button" className="btn" onClick={e => this.relocate(e, mainurl)}>GO TO PODCAST</button>
                        </div>
                    </div>
                </div>
            );
        }
    }
}

export default PodcastPage;