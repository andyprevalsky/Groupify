import { withRouter } from 'next/router'
import querystring from 'querystring'
import React, { Component } from 'react'
import { OauthSender } from 'react-oauth-flow';


const S_CLIENT_ID = 'cb443358fc6f47fc8b82c129cbb70440';
//const S_CLIENT_SECRET = 'c357352a9115423495a8be6b79fb26c1';
const REDIRECT_URI = 'http://localhost:3000/';
const extension = querystring.stringify({
  scope: 'user-read-private user-read-recently-played user-top-read user-modify-playback-state user-read-playback-state'
});
const url = `https://accounts.spotify.com/authorize/?${extension}`;
let code = ""

class Index extends Component {
    constructor(props) {
        super(props)
        this.state = {hubId: "", userId: ""}
        this.inputChange = this.inputChange.bind(this)
    }
    componentDidMount() {
        const { router } = this.props
        router.prefetch('/host')
        router.prefetch('/guest')
        console.log(this.props.router)
        this.handleOpenURL(this.props.router.asPath)
        this.setState({userId: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            })
        })
    }

    toHost () {
        const { router } = this.props;
        router.push("/host")
    }

    toGuest() {
        const { router } = this.props;
        
        router.push("/guest")
    }

    addUserToHub(hubId, userId, direction) {
        if (direction === "toHost") {
            fetch('https://soundhubflask.herokuapp.com/hubs/addHub', {
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
                console.log(Jresponse)
                //set hubId
            })
        }
        fetch('https://soundhubflask.herokuapp.com/hubs/addUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                user_id: userId,
                hub_id: hubId
            })
        }).then(() => {
            if (direction === "toHost") {
                this.toHost()
            } else {
                this.toGuest()
            }
        })
    }

    handleOpenURL(url) {    
        if (url.includes('error')) {
          console.error('Denied Spotify Authentication');
        } else if (url.includes('code=') && url.includes('state=')) {
          let code = url.split('code=')[1].split('&state=')[0];
          let hubId = url.split('---')[1];
          let userId = url.split('---')[2];
          let direction = url.split('---')[3];
          console.log("Code " + code)
          console.log("HubId " + hubId)
          console.log("UserId " + userId)
          console.log("Direction " + direction)
          return
          if (code.includes('#_=_')) {
            code = code.split('#_=_')[0];
          }
          fetch('https://soundhubflask.herokuapp.com/auth/newToken', { //the server hosted with flask
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
              code
            })
          }).then((response) => response.json())
          .then((Jresponse) => {
            firebase.database().ref(`/users/${userId}`)
            .set({ RefreshToken: Jresponse.refresh_token });
            this.addUserToHub(hubId, userId, direction)
           // Actions.Logged_In();
          });
        }
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
