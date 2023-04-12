import logo from './logo.svg';
import './App.css';
import OvenPlayer from 'ovenplayer';
import { useEffect, useState } from "react";
import { Box, Button, Grid, IconButton, Menu, MenuItem } from "@mui/material";
import OvenLiveKit from 'ovenlivekit'
import { useParams, useNavigate } from "react-router-dom";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Pause } from '@mui/icons-material';
import PanToolIcon from '@mui/icons-material/PanTool';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

var React = require('react');

function Main() {
    const [player, setPlayer] = useState();
    const { liveId, userId } = useParams();
    const [roomSocketUrl, setRoomSocketUrl] = useState("ws://110.227.200.246:6060/room/" + liveId + "/" + userId + "/false")
    const [micAllowed, setMicAllowed] = useState(false);
    const [raisedHand, setRaisedHand] = useState(false);
    const [audioStreams, setAudioStreams] = useState([]);
    const [mainStreamId, setMainStreamId] = useState();
    const [mic, setMic] = useState(false);
    const [mediaStream, setMediaStream] = useState();
    const streamId = Date.now().toString();
    const [audioPlayer, setAudioPLayers] = useState([]);
    const interval = setInterval(checkPlayerError, 500);
    const [playPause, setPlayPause] = useState(false);
    const [muteUnmutes, setMuteUnmutes] = useState(false);
    const [raisedHandState, setRaisedHandState] = useState(false);
    const [audioInputDevices, setAudioInputDevices] = useState([]);
    const [menuDevice, setMenuDevice] = useState(null);
    console.log('audioInputDevices', audioInputDevices);




    function checkPlayerError() {
        audioPlayer.forEach(value => {
            // console.log("loop",value.getState());
            if (value.getState() === 'error') {
                value.play();
            }
        })
    }
    let ovenLivekit = OvenLiveKit.create({
        callbacks: {
            error: function (error) {
                console.log("error", error);
            },
            connected: function (event) {
                console.log("event", event);
                // ovenLivekit.inputStream.getAudioTracks()[0].enabled;
                addStream();

            },
            connectionClosed: function (type, event) {
                console.log("close", type, event)
            },
            iceStateChange: function (state) {
                console.log("state", state);
            }
        }
    });

    const {
        sendMessage: sendRoomMessage,
        lastMessage: roomLastMessage,
        readyState: roomReadyState
    } = useWebSocket(roomSocketUrl, {

        onOpen: () => {
            console.log('WebSocket room connection established.');
            fetchMainStream();

        }
        ,
        onMessage: (message) => {
            console.log(message);
            const data = JSON.parse(message.data);
            console.log('datadata', data);
            if (data.type === 'streams') {
                setAudioStreams(data.streams);
            }
            if (data.type === 'mainStream') {
                setMainStreamId(data.stream);
                loadPlayer(data.stream);
            }
            if (data.type === 'micAllowed') {
                setMicAllowed(true);
                initializeAudioStream();
            }
            if (data.command === 'broadcastStream') {
                console.log(data, streamId, data.userId, userId);

                if (!(data.userId.toString() === userId)) {
                    setAudioStreams([...audioStreams, data.streamId]);
                }

            }


        }
    });

    function initializeAudioStream() {
        ovenLivekit.getUserMedia({
            audio: true,
            video: true
        }).then(function (stream) {
            setMediaStream(stream);

            ovenLivekit.startStreaming('wss://stream.softkitesinfo.com/app/' + streamId + '?direction=send&transport=tcp');
            stream.getVideoTracks().forEach(value => {
                value.enabled = false;
            })
            stream.getAudioTracks()[0].enabled = true;

            // addStream();

        });
    }

    function fetchMainStream() {
        var msg = { "type": "fetchMainStream" };
        sendRoomMessage(JSON.stringify(msg));

    }

    function fetchAudioStreams() {
        var msg = { "type": "fetchStreams" };
        sendRoomMessage(JSON.stringify(msg));
    }


    useEffect(() => {
        if (player != undefined)
            player.setMute(true);


    }, [player])

    function loadPlayer(stream) {
        const videoPlayer = OvenPlayer.create('mainStream', {
            sources: [
                {

                    label: 'label_for_webrtc',
                    // Set the type to 'webrtc'
                    type: 'webrtc',
                    // Set the file to WebRTC Signaling URL with OvenMediaEngine
                    file: 'wss://stream.softkitesinfo.com/app/' + stream

                },
            ],
            mute: true,
            autoStart: true,



        });
        videoPlayer.showControls(false)
        videoPlayer.on('stateChanged', function (data) {
            if (data?.newstate === "playing") {
                setPlayPause(true)
            } else {
                setPlayPause(false)
            }

        })
        videoPlayer.on('mute', function (data) {
            if (data?.mute === true) {
                setMuteUnmutes(true)
            } else {
                setMuteUnmutes(false)
            }

        })
        setPlayer(videoPlayer);
        // setPlayer(OvenPlayer.create('mainStream', {
        //     sources: [
        //         {

        //             label: 'label_for_webrtc',
        //             type: 'webrtc',
        //             file: 'wss://stream.softkitesinfo.com/app/' + stream

        //         },
        //     ],
        //     mute: true,
        //     autoStart: true,



        // }));

        fetchAudioStreams();

    }

    function raiseHand() {
        setRaisedHandState(true)
        var msg = { "type": "raiseHand" };
        sendRoomMessage(JSON.stringify(msg));
    }

    function addStream() {
        var msg = { "type": "addStream", "data": streamId }
        sendRoomMessage(JSON.stringify(msg));
    }

    function muteUnmute() {

        player.setMute(!player.getMute());

    }

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            devices.forEach(device => {
                console.log('device', device);

                if (device?.InputDeviceInfo?.kind === "audioinput") {
                    if (device?.InputDeviceInfo?.deviceId !== '' || device?.InputDeviceInfo?.deviceId !== undefined) {
                        let newArr = []
                        newArr.push(device)
                        setAudioInputDevices(newArr)
                    }
                }
            })
        })
    }, []);

    useEffect(() => {
        // audioStreams.forEach((value,index) =>{
        //     const div=document.createElement("div");
        //     div.setAttribute("id", 'audio'+index);
        // } );
        let aPlayers = [];
        audioStreams.forEach((value, index) => {

            let aplayer = OvenPlayer.create('audio' + index, {
                sources: [
                    {

                        label: 'label_for_webrtc',
                        // Set the type to 'webrtc'
                        type: 'webrtc',
                        // Set the file to WebRTC Signaling URL with OvenMediaEngine
                        file: 'wss://stream.softkitesinfo.com/app/' + value

                    }
                ], autoStart: true,

                webrtcConfig:
                {
                    timeoutMaxRetry: 100000,
                    connectionTimeout: 50000
                }

            });
            aPlayers.push(aplayer);
            setAudioPLayers(aPlayers);
        })

    }, [audioStreams])


    function muteUnmuteMic() {
        if (micAllowed && audioInputDevices?.length > 0) {
            if (mic) {
                setMic(false);
                mediaStream.getAudioTracks()[0].enabled = false;
            }
            else {
                setMic(true);
                mediaStream.getAudioTracks()[0].enabled = true;
            }
        }
    }

    const handlePlay = () => {
        player?.play();
    }
    const handlePouse = () => {
        player?.pause();
    }
    const handleVolumeOn = () => {
        player?.setMute();
    }
    const handleVolumeOff = () => {
        player?.setMute();
    }
    const handleMenu = (event) => {
        setMenuDevice(event.currentTarget);
    };

    const handleClose = () => {
        setMenuDevice(null);
    };

    return (
        <div className="App">

            <Grid container>

                {
                    audioStreams.map((value, index) => {
                        console.log("audio" + index);
                        return <Grid item key={index}> <Box
                            sx={{
                                width: 0,
                                height: 0,
                                backgroundColor: 'primary.dark',
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                    opacity: [0.9, 0.8, 0.7],
                                },
                            }}
                        >
                            {React.createElement("div", { id: 'audio' + index })}
                        </Box>
                        </Grid>
                    })
                }

            </Grid>
            <Grid item>
                <Box height="100vh" display="flex" flexDirection="column" sx={{ backgroundColor: "black" }}>
                    <div id="mainStream" style={{ position: "relative" }}></div>
                    <Box sx={{ position: "absolute", bottom: "0", left: "0", right: "0", paddingBottom: "20px" }}>

                        <Button onClick={raiseHand}>
                            <PanToolIcon sx={{ color: raisedHandState ? "green" : '#cccccc' }} />
                        </Button>
                        {!playPause ?
                            <Button onClick={handlePlay}><PlayArrowIcon sx={{ color: '#cccccc' }} /></Button>
                            : <Button onClick={handlePouse}>
                                <Pause sx={{ color: '#cccccc' }} />
                            </Button>
                        }
                        {
                            muteUnmutes ? <Button onClick={handleVolumeOn}>
                                <VolumeUpIcon sx={{ color: '#cccccc' }} />
                            </Button> : <Button onClick={handleVolumeOff}>
                                <VolumeOffIcon sx={{ color: '#cccccc' }} />
                            </Button>
                        }
                        <Button onClick={() => { muteUnmuteMic() }}>
                            {
                                mic ?
                                    <MicIcon sx={{ color: '#cccccc' }} />
                                    :
                                    <MicOffIcon sx={{ color: micAllowed ? '#cccccc' : "#cccccc7a" }} />
                            }
                        </Button>
                        <Button sx={{ marginLeft: "-40px", marginTop: "-10px" }}>
                            <KeyboardArrowUpIcon onClick={handleMenu} sx={{ color: '#cccccc' }} fontSize='small' />
                            <Menu
                                id="menu-appbar"
                                anchorEl={menuDevice}
                                getContentAnchorEl={null}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                transformOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'center',
                                }}
                                keepMounted
                                open={Boolean(menuDevice)}
                                onClose={handleClose}
                            >
                                {
                                    audioInputDevices?.length > 0 && audioInputDevices.map((option, i) => {
                                        return <MenuItem onClick={handleClose} key={i}>{option?.InputDeviceInfo?.kind}</MenuItem>
                                    })
                                }

                            </Menu>
                        </Button>
                    </Box>
                </Box>
            </Grid>

            {/*<Button variant="contained"*/}
            {/*        onClick={() => muteUnmute()}>{player != undefined && player.getMute() ? "UnMute" : "Mute"}</Button>*/}
            {/*<Button variant="contained" onClick={() => muteUnmuteMic()}>{mic ? "micon" : "micoff"}</Button>*/}
            {/*<Button variant="contained" onClick={() => raiseHand()}>raise doubt</Button>*/}

        </div>
    );
}

export default Main;

