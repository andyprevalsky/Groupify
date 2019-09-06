import { withRouter } from 'next/router'
import querystring from 'querystring'
import React, { Component } from 'react'
import { OauthSender } from 'react-oauth-flow';
import firebase from 'firebase';

const S_CLIENT_ID = 'cb443358fc6f47fc8b82c129cbb70440';
//const S_CLIENT_SECRET = 'c357352a9115423495a8be6b79fb26c1';
const REDIRECT_URI = 'http://localhost:3000/';
const backendUrl = "http://127.0.0.1:5000/"
const extension = querystring.stringify({
  scope: 'user-read-private user-read-recently-played user-top-read user-modify-playback-state user-read-playback-state'
});
const url = `https://accounts.spotify.com/authorize/?${extension}`;

class Index extends Component {
    constructor(props) {
        super(props)
        this.state = {hubId: "", userId: ""}
        this.inputChange = this.inputChange.bind(this)
    }

    componentWillMount() {
        const config = {
            apiKey: 'AIzaSyBVt5xV-rwdWfYU4pICMNIEgdB0GN434Vg',
            authDomain: 'musicapp-a40f1.firebaseapp.com',
            databaseURL: 'https://musicapp-a40f1.firebaseio.com',
            projectId: 'musicapp-a40f1',
            storageBucket: 'musicapp-a40f1.appspot.com',
            messagingSenderId: '868653032624'
          };
        try {
            firebase.initializeApp(config);
        } catch {}
    }

    componentDidMount() {
        const { router } = this.props
        router.prefetch('/host')
        router.prefetch('/guest')
        console.log(this.props.router)
        if (this.handleOpenURL(this.props.router.asPath)) {
            this.setState({userId: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
                })
            })
        }
    }

    toHost (hubId) {
        const { router } = this.props;
        router.push({
            pathname: "/host",
            query: {hubId: this.state.hubId, userId: this.state.userId}
        })
    }

    toGuest() {
        const { router } = this.props;
        
        router.push("/guest")
    }

    addUserToHub(hubId, userId, direction) {
        if (direction === "toHost") {
            fetch(backendUrl + 'hubs/addHub', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: querystring.stringify({
                        lat:"0",
                        lng:"0",
                        userId
                    })
            }).then((response) => response.json())
            .then((Jresponse) => {
                hubId = Jresponse.hubId
                this.setState({hubId: hubId})
                fetch(backendUrl + 'hubs/addUser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: querystring.stringify({
                        user_id: userId,
                        hub_id: hubId
                    })
                }).then(() => {
                    this.toHost(hubId)
                })
            })
            return
        }
        fetch(backendUrl + 'hubs/addUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                user_id: userId,
                hub_id: hubId
            })
        }).then(() => {
            this.toGuest()
        })
    }

    handleOpenURL(url) {    
        if (url.includes('error')) {
          console.error('Denied Spotify Authentication');
          return true;
        } else if (url.includes('code=') && url.includes('state=')) {
          let code = url.split('code=')[1].split('&state=')[0];
          let hubId = url.split('---')[1];
          let userId = url.split('---')[2];
          this.setState({userId: userId})
          let direction = url.split('---')[3];
          console.log("Code " + code)
          console.log("HubId " + hubId)
          console.log("UserId " + userId)
          console.log("Direction " + direction)
          if (code.includes('#_=_')) {
            code = code.split('#_=_')[0];
          }
          fetch(backendUrl + 'auth/newToken', { //the server hosted with flask
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
              code
            })
          }).then((response) => response.json())
          .then((Jresponse) => {
            const loc = userId + "/RefreshToken"
            firebase.database().ref('/users').update({ [loc]: Jresponse.refresh_token }).then(() => this.addUserToHub(hubId, userId, direction))
          });
          return false;
        }
        return true;
    }

    inputChange(event) {
        this.setState({hubId: event.target.value})
    }

    render() {
        const { router } = this.props;
        return (
            <div>
                <OauthSender
                    authorizeUrl={url}
                    redirectUri={REDIRECT_URI}
                    clientId={S_CLIENT_ID}
                    state={{ code: "---" + "HUBIDTEMP" + "---" + this.state.userId + "---" + "toHost" + "---"}}
                    render={({ url }) => <a href={url}>Create a Room Spotify</a>}
                />
                <OauthSender
                    authorizeUrl={url}
                    redirectUri={REDIRECT_URI}
                    clientId={S_CLIENT_ID}
                    state={{ code: "---" + this.state.hubId + "---" + this.state.userId + "---" + "toGuest" + "---"}}
                    render={({ url }) => <a href={url}>Join a Room Spotify</a>}
                />
                <input type="text" value={this.state.hubId} onChange={this.inputChange} />
            </div>
        );
    }
}

export default withRouter(Index);
