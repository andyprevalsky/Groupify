import React, { Component } from 'react';
import { withRouter } from 'next/router'
import querystring from 'querystring'
import TimerMixin from 'react-timer-mixin';
// import { DeleteOverlay } from './common/DeleteOverlay';

const backendUrl = "http://127.0.0.1:5000/"

class Host extends Component {
    state = { isChildOpen: false,    
        hubId: '',
        showDeleteHub: false,
        currentSongInfo: undefined,
        playbackDevice: undefined,
        availableDevices: undefined,
        playState: '',
        songProgress: 0,
        timeSpacing: 0,
        userCount: undefined
    }
    componentWillMount() {
        this.state.userId = this.props.router.query.userId
        this.state.hubId = this.props.router.query.hubId
        fetch(backendUrl + 'hubs/getRecentlyPlayed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                userId: this.state.userId,
                hubId: this.state.hubId
            })
        }).then(response => response.json().then(
            songInfo => this.setState({currSongInfo:songInfo})))
        .catch(() => {
            fetch(backendUrl + 'hubs/getNextSong', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: querystring.stringify({
                    userId: this.state.userId,
                    hubId: this.state.hubId
                })
            }).then(response => response.json().then(
                songInfo => {this.state.currSongInfo = songInfo}))
            .catch(() => this.state.userCount = 0).then(() => this.playSong()); //no users
        }).then(() => {
            if (!this.state.playbackDevice) {
                this.setPlayback();
            }
        })
    }


    setPlayback() {
        fetch(backendUrl + 'hubs/getAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                userId: this.state.userId,
            })
        }).then(response => response.json().then(AccessToken =>
            fetch('https://api.spotify.com/v1/me/player/devices', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + AccessToken
            }
        }).then(deviceResp => deviceResp.json().then(devices => {
            console.log(devices.devices);
            this.state.availableDevices = devices.devices;
            try {
                this.state.playbackDevice = devices.devices[0];
            } catch {}
        }))));
    }

    getNextSong() {
        this.state.timeSpacing = 0;
        this.state.songProgress = 0;
        fetch(backendUrl + 'hubs/getNextSong', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                userId: this.state.userId,
                hubId: this.state.hubId
            })
        }).then(response => response.json().then(
            songInfo => this.setState({currSongInfo:songInfo})
        )).then(() => this.playSong())
        .catch(err => console.log(err));
    }

    getPreviousSong() {
        this.state.timeSpacing = 0;
        this.state.songProgress = 0;
        fetch(backendUrl + 'hubs/getPreviousSong', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                userId: this.state.userId,
                hubId: this.state.hubId
            })
        }).then(response => response.json().then(
            songInfo => this.setState({currSongInfo:songInfo})
        )).then(() => this.playSong())
        .catch(err => console.log(err));
    }

    getProgress() {
        let progress = 0;
        if (this.state.currSongInfo) {
            progress = this.state.songProgress / this.state.currSongInfo.duration_ms;
        }
        return progress;
    }

    getPlaybackName() {
        if (this.state.playbackDevice) {
            return this.state.playbackDevice.name;
        }
        return undefined;
    }

    playSong() {
        let uris;
        if (this.state.songProgress <= 5000) {
            uris = JSON.stringify({ uris: [this.state.currSongInfo.uri] });
            this.state.songProgress = 0;
        }
        fetch(backendUrl + 'hubs/getAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                userId: this.state.userId,
            })
        }).then(response => response.json().then(AccessToken => {
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.state.playbackDevice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: 'Bearer ' + AccessToken
                },
                body: uris
            });
        })).then(() => this.state.playState = 'playing')
            .then(() => {
                this.state.timeSpacing = new Date().getTime();
                TimerMixin.setTimeout.call(this, () => { this.updateSongProgress(); }, 1000);
            });
    }

    updateSongProgress() {
        // new Date().getTime()
        if (this.state.playState && this.state.timeSpacing !== 0) { //if song is playing then keep updating
            this.state.songProgress = this.state.songProgress + (new Date().getTime() - this.state.timeSpacing);
            this.state.timeSpacing = new Date().getTime();
            TimerMixin.setTimeout.call(this, () => this.updateSongProgress(), 1000);
        }
        if (this.state.currSongInfo.duration_ms <= this.state.songProgress) {
            this.getNextSong();
        }
    }

    updateSongProgressSpot() {
        fetch(backendUrl + 'hubs/getAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                userId: this.state.userId,
            })
        }).then(response => response.json().then(AccessToken => {
            fetch('https://api.spotify.com/v1/me/player', {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + AccessToken
                }
            }).then(response2 => response2.json().then(data => this.state.songProgress = data.progress_ms));
        }));
        if (this.state.currSongInfo.duration_ms <= this.state.songProgress) {
            this.getNextSong();
        }
    }

    millisToMinutesAndSeconds(millis) {
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return (seconds === 60 ? (minutes + 1) + ':00' : minutes + ':' + (seconds < 10 ? '0' : '') + seconds);
    }

    pauseSong() {
        fetch(backendUrl + 'hubs/getAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                userId: this.state.userId,
            })
        }).then(response => response.json().then(AccessToken =>
            fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${this.state.playbackDevice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + AccessToken
                },
            }))).then(() => {
                this.updateSongProgressSpot();
                this.state.playState = '';
            });
    }


    deleteHub() {
        fetch(backendUrl + 'hubs/deleteHub', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                userId: this.state.userId,
                hubId: this.state.hubId
            })
        }).catch(err => console.log(err));
    }

    clearOverlay() {
        this.state.showDeleteHub = false;
    }

    chooseDevice(i) {
        this.state.setPlaybackDevice = this.state.availableDevices[i];
        this.state.availableDevices = undefined;
    }

    noUsers() {
        return (
            <View style={styles.noUserContainerStyle}>
                <Text style={styles.noUserTextStyle}> No Users </Text>
            </View>
        );
    }

    // chooseAvailableDevices() {
    //     if (this.props.userCount !== 0) {
    //         return (
    //             <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, .6)' }}>
    //                 <View style={styles.availDeviceOverlay}>
    //                     <Text style={styles.connectTextStyle}> Connect to a device </Text>
    //                     <List style={styles.deviceContainerStyle}>
    //                     {
    //                         this.props.availableDevices.map((item, i) => (
    //                             <View style={{ flexDirection: 'row', alignContent: 'center', paddingTop: 20 }} key={i}>
    //                                 <Icon
    //                                     name={item.type === 'Smartphone' ? 'mobile-phone' : 'computer'}
    //                                     containerStyle={{ paddingLeft: 20, paddingRight: 20, backgroundColor: Color2 }}
    //                                     onPress={() => this.chooseDevice(i)}
    //                                     type={item.type === 'Smartphone' ? 'font-awesome' : 'MaterialIcons'}
    //                                     color={item.name === this.getPlaybackName() ? Color3 : Color1}
    //                                     underlayColor='rgba(0, 0, 0, .0)'
    //                                     size={25}
    //                                 />
    //                                 <ListItem
    //                                     hideChevron
    //                                     title={item.name}
    //                                     onPress={() => this.chooseDevice(i)}
    //                                     underlayColor='rgba(0, 0, 0, .0)'
    //                                     titleStyle={item.name === this.getPlaybackName() ? { color: Color3 } : { color: Color1 }}
    //                                     containerStyle={styles.deviceStyle}
    //                                 />
    //                             </View>
    //                         ))
    //                     }
    //                     </List>
    //                 </View>
    //             </View>
    //         );
    //     }

    //     return;
    // }

    // renderBack() {
    //     return (
    //         <Icon
    //             containerStyle={{ paddingTop: 17 }}
    //             name='ios-arrow-back'
    //             onPress={() => Actions.Map()}
    //             type='ionicon'
    //             color='white'
    //             underlayColor='rgba(0, 0, 0, .0)'
    //         />
    //     );
    // }

    // renderPlay() {
    //     return (
    //         <Icon 
    //             name='play-circle-outline'
    //             type='MaterialIcons'
    //             onPress={() => this.playSong()}
    //             color={Color1}
    //             underlayColor='rgba(0, 0, 0, .0)'
    //             size={75}
    //         />
    //     );
    // }

    // renderPause() {
    //     return (
    //         <Icon 
    //             name='pause-circle-outline'
    //             type='MaterialIcons'
    //             onPress={() => this.pauseSong()}
    //             color={Color1}
    //             underlayColor='rgba(0, 0, 0, .0)'
    //             size={75}
    //         />
    //     );
    // }
    
    // renderAlbumCover() {
    //     if (this.props.currSongInfo) {
    //         return (
    //             <Image
    //                 source={{ url: this.props.currSongInfo.album.images[0].url }}
    //                 style={{ height: 300, width: 300, alignSelf: 'center' }}
    //             />
    //         );
    //     }

    //     return (
    //         <Image
    //             source={defaultAlbumCover}
    //             style={{ height: 300, width: 300, alignSelf: 'center' }}
    //         />
    //     );
    // }

    // renderArtistName() {
    //     if (this.props.currSongInfo) {
    //         return (
    //             <Text
    //                 style={styles.artistNameStyle}
    //             >
    //                 {this.props.currSongInfo.artists[0].name}
    //             </Text>
    //         );
    //     }
    //     return (
    //         <Text
    //             style={styles.artistNameStyle}
    //         >
    //             Artist
    //         </Text>
    //     );
    // }

    // renderSongName() {
    //     if (this.props.currSongInfo) {
    //         return (
    //             <Text
    //                 style={styles.songNameStyle}
    //             >
    //                 {this.props.currSongInfo.name}
    //             </Text>
    //         );
    //     }
    //     return (
    //         <Text
    //             style={styles.songNameStyle}
    //         >
    //             Song
    //         </Text>
    //     );
    // }

    render() {
        // const showDeleteOverlay =
        // (<DeleteOverlay
        //     onPressYes={() => {
        //         this.deleteHub();
        //         this.clearOverlay();
        //         Actions.Map();
        //     }}
        //     onPressNo={() => {
        //         this.clearOverlay();
        //     }}
        // >
        //     Are you sure you want to stop hosting this hub?
        // </DeleteOverlay>);

        return (
            // <ImageBackground source={background} style={{ flex: 1, backgroundColor: 'black' }}>
            //     <View style={styles.headerStyling}>
            //         <Icon
            //             containerStyle={{ padding: 10, paddingLeft: 15, alignSelf: 'flex-start' }}
            //             name='ios-arrow-back'
            //             onPress={() => Actions.Map()}
            //             type='ionicon'
            //             color='white'
            //             underlayColor='rgba(0, 0, 0, .0)'
            //         />
            //         <Icon
            //             containerStyle={{ padding: 10, paddingRight: 15, alignSelf: 'flex-end' }}
            //             name='x'
            //             onPress={() => this.props.showDeleteHub(true)}
            //             type='feather'
            //             color='white'
            //             underlayColor='rgba(0, 0, 0, .0)'
            //         />
            //     </View>
            //     <View style={{ flex: 1 }}>
            //         <View style={styles.userCountContainerStyle}>
            //             <Text style={styles.userCountStyle}> {this.props.userCount} Users </Text>
            //         </View>
            //         <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
            //             {this.renderAlbumCover()}
            //             {this.renderArtistName()}
            //             {this.renderSongName()}
            //             <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            //                 <Text style={{ color: Color1, margin: 10 }}>{this.millisToMinutesAndSeconds(this.props.songProgress)}</Text>
            //                 <ProgressBar
            //                     fillStyle={{}}
            //                     backgroundStyle={{ backgroundColor: '#cccccc', borderRadius: 2 }}
            //                     style={{ marginTop: 17, width: 250 }}
            //                     progress={this.getProgress()}
            //                 />
            //                 <Text style={{ color: Color1, margin: 10 }}>
            //                     {this.props.currSongInfo ?
            //                     this.millisToMinutesAndSeconds(this.props.currSongInfo.duration_ms) : '0:00'}
            //                 </Text>
            //             </View>
            //         </View>
            //         <View style={styles.navigationContainerStyle}>
            //             <Icon
            //                 name='controller-jump-to-start'
            //                 containerStyle={{ padding: 10, paddingRight: 20 }}
            //                 onPress={() => this.getPreviousSong()}
            //                 type='entypo'
            //                 color={Color1}
            //                 underlayColor='rgba(0, 0, 0, .0)'
            //                 size={35}
            //             />
            //             {this.props.playState ? this.renderPause() : this.renderPlay()}
            //             <Icon
            //                     name='controller-next'
            //                     containerStyle={{ padding: 10, paddingLeft: 20 }}
            //                     onPress={() => this.getNextSong()}
            //                     type='entypo'
            //                     color={Color1}
            //                     underlayColor='rgba(0, 0, 0, .0)'
            //                     size={35}
            //             />
            //         </View>
            //         <TouchableOpacity
            //             style={styles.availDevicesButtonStyle}
            //             onPress={() => this.setPlayback()}
            //         >
            //             <Icon
            //                 name='devices'
            //                 containerStyle={{ paddingRight: 5 }}
            //                 type='MaterialIcons'
            //                 color={Color1}
            //                 underlayColor='rgba(0, 0, 0, .0)'
            //                 size={15}
            //             />
            //             <Text style={styles.avalDevicesTextStyle}> Available Devices </Text>
            //         </TouchableOpacity>
            //     </View>
            //     {this.props.showDelHub ? showDeleteOverlay : null}
            //     {this.props.availableDevices ? this.chooseAvailableDevices() : null }
            //     {this.props.userCount === 0 ? this.noUsers() : null}
            // </ImageBackground>
            <div>
                <div>toHost</div>
                <span onClick={() => this.getNextSong()}>Next Song</span>
            </div>
        );
    }
}

export default withRouter(Host);