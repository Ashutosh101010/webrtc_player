import './App.css';
import OvenPlayer from 'ovenplayer';
import { useCallback, useEffect, useState } from "react";
import {
    Backdrop,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    Menu,
    MenuItem
} from "@mui/material";
import OvenLiveKit from 'ovenlivekit'
import { useLocation, useParams } from "react-router-dom";
import useWebSocket from 'react-use-websocket';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Pause } from '@mui/icons-material';
import PanToolIcon from '@mui/icons-material/PanTool';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SettingsIcon from '@mui/icons-material/Settings';
import { Circle } from "styled-spinkit";
import MainModal from './MainModal';
import axios from 'axios';
import ErrorModal from './ErrorModal';

var React = require('react');

const STUDENT_DETAIL_URL = "https://api.softkitesinfo.com/student/fetch-details";
const FETCH_INSTITUTE_URL = "https://api.softkitesinfo.com/getMetaData/fetch-institute"

function Main() {
    const [player, setPlayer] = useState();
    const {liveId, userId} = useParams();
    const location = useLocation();
    const token = location.search.split("?token=").join('');
    const [roomSocketUrl, setRoomSocketUrl] = useState("")
    const [micAllowed, setMicAllowed] = useState(false);
    const [audioStreams, setAudioStreams] = useState([]);
    const [mainStreamId, setMainStreamId] = useState();
    const [mic, setMic] = useState(false);
    const [mediaStream, setMediaStream] = useState();
    const [streamId, setStreamId] = useState("");
    const [playPause, setPlayPause] = useState(false);
    const [muteUnmutes, setMuteUnmutes] = useState(false);
    const [raisedHandState, setRaisedHandState] = useState(false);
    const [audioInputDevices, setAudioInputDevices] = useState([]);
    const [menuDevice, setMenuDevice] = useState(null);
    const [authUser, setAuthUser] = useState('');
    const [settingMenu, setSettingMenu] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [style, setStyle] = useState(false);
    const [audioStreamMap, setAudioStreamMap] = useState(new Map());
    const [currentStreams, setCurrentStreams] = useState([]);
    const [available, setAvailable] = useState(false);
    const playerQuality = [
        "Auto", "4k", "1080p", "720p", "480p", "360p"
    ]
    const [selectedQuality, setSelectedQuality] = useState("Auto");
    const [pause, setPause] = useState(false);
    const [instituteList, setInstituteList] = useState([]);
    const moduleSetting = instituteList?.institute?.instituteModuleSetting;
    const [retry, setRetry] = useState(0);
    const maxRetry = 20;
    const [participants, setParticipants] = useState([]);
    const [roomPing, setRoomPing] = useState(Date.now());
    const [ticking, setticking] = useState(true);
    const [count, setCount] = useState(0);
    const [socketNetworkError, setSocketNetworkError] = useState(false);
    const [streaming, setStreaming] = useState(false);
    useEffect(() => {
        if (participants.length > 0) {
            participants.forEach((items) => {
                if (parseInt(items.userId) === parseInt(userId)) {

                    if(micAllowed!==items.micAllow)
                    {
                        setMicAllowed(items.micAllow);
                    }

                        if(micAllowed!==items.micAllow && items.micAllow===true)
                        {
                            setRaisedHandState(false);
                            var msg = {"type":  "unRaise"};
                            sendRoomMessage(JSON.stringify(msg));
                        }




                    if (streamId === "") {
                        setStreamId(items.audioStreamId);
                    }


                    if(micAllowed===false)
                    {
                        setMic(false);
                    }else{
                    setMic(!items.mute);
                    }



                }
            })
        }

    }, [participants])


    useEffect(() => {
        if (!available && streamId !== "") {
            initializeAudioStream();
        }
    }, [streamId])
    useEffect(() => {
        checkVideo();
        if (roomSocketUrl !== "") {
            if(!socketNetworkError)
            {
            sendPing();
            }
            if ((Date.now() - roomPing > 5000)) {
                setSocketNetworkError(true);
                // connect();
            }else{
                setSocketNetworkError(false);
            }
        }

        if(!streaming && roomSocketUrl!=="")
        {
            console.log("useeffect stream",streaming,roomSocketUrl);
            initializeAudioStream();
        }
        const timer = setTimeout(() => ticking && setCount(count + 1), 2e3);
        return () => clearTimeout(timer);
    }, [count, ticking]);

    useEffect(() => {
        checkPlayerError();
        StudentFetchDetail();
        getInstituteDetail();

    }, [])


    function sendPing() {
        if(!socketNetworkError)
        {
            var object = {"type": "ping"};
            sendRoomMessage(JSON.stringify(object));
        }

    }

    const getInstituteDetail = async () => {

        try {
            let response = await axios.get(
                FETCH_INSTITUTE_URL,
                {
                    headers: {"X-Auth": token},
                    withCredentials: false,
                }
            );
            ;

            setInstituteList(response.data)
        } catch (err) {
            console.log(err);
        }
    }


    const StudentFetchDetail = async () => {
        setIsLoading(true)
        try {
            const response = await axios.get(
                STUDENT_DETAIL_URL,
                {
                    headers: {"X-Auth": token}
                }
            );
            setAuthUser(response?.data)
            setIsLoading(false)
            return response;
        } catch (error) {
            console.error(error);
        }
    }

    function checkVideo() {
        try {
            if(player!==undefined)
            {
            if (player.getState() === 'error') {
                loadPlayer(mainStreamId);
            }
            if (player.getState() !== 'playing') {
                if (!pause) {
                    player.play();
                }
            }
            }
        } catch (e) {
            console.log(e);
        }

        // try {
        //     if (!available && retry < maxRetry) {
        //         initializeAudioStream();
        //         let tempRetry = retry;
        //         setRetry(tempRetry++);
        //     }
        // } catch (e) {
        //
        // }
    }

    function checkPlayerError() {

        try {
            Array.from(audioStreamMap.keys()).map(key => {
                let value = audioStreamMap.get(parseInt(key));
                if (value !== undefined && value !== '' && value.getState() !== 'playing') {
                    value.play();
                }
            });
        } catch (e) {

        }

        try {

        } catch (e) {

        }

    }

    let ovenLivekit = OvenLiveKit.create({
        callbacks: {
            error: function (error) {
                console.log("error", error);
                // setStreaming(false);
            },
            connected: function (event) {
                console.log("event", event);
                // ovenLivekit.inputStream.getAudioTracks()[0].enabled;
                setStreaming(true);

            },
            connectionClosed: function (type, event) {
                console.log("close", type, event);
                setStreaming(false);
                // initializeAudioStream();
            },
            iceStateChange: function (state) {
                console.log("state", state);
                try {
                    if (state === 'connected') {
                        // addStream();
                        setAvailable(true);
                        setMicAllowed(true);
                        setRaisedHandState(false);
                        setStreaming(true);
                    }
                    else if (state === 'closed' || state === 'failed') {
                        console.log("failed");
                        setAvailable(false);
                        // initializeAudioStream();
                        setStreaming(false);
                    }
                } catch (e) {
                    setStreaming(false);
                }
            }
        }
    });

    const connectSocket = useCallback(

        () => {
            setRoomSocketUrl("");
            var url="wss://api.softkitesinfo.com/ws/room/" + liveId + "/" + userId + "/false";
            setRoomSocketUrl(url)
        },
        []
    );

    function connect() {
        connectSocket();
    }

    const {
        sendMessage: sendRoomMessage,
        lastMessage: roomLastMessage,
        readyState: roomReadyState,
    } = useWebSocket(roomSocketUrl, {
        shouldReconnect: (closeEvent) => true,
        reconnectAttempts: 10000,
        reconnectInterval:2000,
        onOpen: () => {
            console.log('WebSocket room connection established.');
            // fetchMainStream();
            // initializeAudioStream();
        }
        ,
        onMessage: (message) => {
            setRoomPing(Date.now());
            const data = JSON.parse(message.data);
            // checkVideo();
            console.log('data', data);
            if (data.type === "students") {
                setParticipants(data.students);
            }
            if (data.type === 'streams') {
                let streams = [...currentStreams];
                data.streams.forEach(value => {
                    if (!streams.includes(value.toString())) {
                        console.log('push');
                        streams.push(value.toString());
                        setCurrentStreams(streams);
                    }
                });
                setAudioStreams(data.streams);
            }
            if (data.type === 'mainStream') {
                setMainStreamId(data.stream);
                loadPlayer(data.stream);
            }
            // if (data.type === 'micAllowed') {
            //     if (available) {
            //         setMic(false);
            //         setMicAllowed(true);
            //
            //         setRaisedHandState(false);
            //
            //     }
            //     // if (!available) {
            //     //     initializeAudioStream();
            //     // }
            //
            // }
            // if (data.type === 'micDisallowed') {
            //     setMic(false);
            //     setMicAllowed(false);
            //     // removeStream();
            //
            // }
            if (data.command === 'broadcastStream') {
                console.log(data, streamId, data.userId, userId);

                if (!(data.userId.toString() === userId)) {
                    setAudioStreams([...audioStreams, data.streamId]);
                }

            }


        }
    });

    // function removeStream() {
    //     setMic(false);
    //     mediaStream.getAudioTracks()[0].enabled = false;
    //     ovenLivekit.stopStreaming();
    // }

    function initializeAudioStream() {
        if(streamId!==""){
            try {
                ovenLivekit.getUserMedia({
                    audio: true,
                    video: true
                }).then(function (stream) {
                    setMediaStream(stream);

                    ovenLivekit.startStreaming('wss://audio.classiolabs.com/app/' + streamId + '?direction=send&transport=tcp');
                    stream.getVideoTracks().forEach(value => {
                        value.enabled = false;
                    })
                    stream.getAudioTracks()[0].enabled = false;

                    // addStream();

                });
            } catch (e) {

            }
        }
    }

    function fetchMainStream() {
        var msg = {"type": "fetchMainStream"};
        sendRoomMessage(JSON.stringify(msg));

    }

    // function fetchAudioStreams() {
    //     var msg = { "type": "fetchStreams" };
    //     sendRoomMessage(JSON.stringify(msg));
    // }


    useEffect(() => {
        if (player != undefined)
            player.setMute(true);


    }, [player])

    useEffect(() => {

    }, [audioStreamMap])

    function loadPlayer(stream) {
        const videoPlayer = OvenPlayer.create('mainStream', {
            sources: [
                {

                    label: '4k',
                    // Set the type to 'webrtc'
                    type: 'webrtc',
                    // Set the file to WebRTC Signaling URL with OvenMediaEngine
                    file: 'wss://stream.classiolabs.com/app/' + stream + '/abr'
                },

            ],
            mute: false,
            autoStart: true,
            showBigPlayButton: false,
            expandFullScreenUI: false
        });
        videoPlayer.setVolume(100)
        videoPlayer.showControls(false)
        videoPlayer.setAutoQuality(true);
        setSelectedQuality('Auto');
        // videoPlayer.setCurrentSource(3)
        // videoPlayer.setMute(false);
        videoPlayer.on('stateChanged', function (data) {
            if (data?.newstate === "playing") {
                setPlayPause(true)

            }
            else {
                setPlayPause(false)

            }

        })
        videoPlayer.on('mute', function (data) {
            if (data?.mute === true) {
                setMuteUnmutes(true)
            }
            else {
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

        // try {
        //     if (audioStreams.length < 1) {
        //         fetchAudioStreams();
        //     }
        // } catch (e) {

        // }


    }

    function raiseHand() {
        let raised = raisedHandState;

        setRaisedHandState(!raised)

        var msg = {"type": raised == true ? "unRaise" : "raiseHand"};
        sendRoomMessage(JSON.stringify(msg));
    }

    function addStream() {
        var msg = {"type": "addStream", "data": streamId}
        sendRoomMessage(JSON.stringify(msg));
    }

    // function muteUnmute() {
    //
    //     player.setMute(!player.getMute());
    //     try {
    //         Array.from(audioStreamMap.keys()).map(key => {
    //             let value = audioStreamMap.get(parseInt(key));
    //             if (value !== undefined && value !== '' && value.getState() !== 'playing') {
    //                 value.play();
    //             }
    //         });
    //     }catch (e)
    //     {
    //
    //     }
    //
    // }

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            console.log(devices);
            let newArr = [];
            devices.forEach(device => {
                if (device) {
                    if ((device.deviceId !== '' || device.deviceId !== undefined) && device.kind == 'audioinput') {

                        newArr.push(device)
                        setAudioInputDevices(newArr)
                    }
                }
            })
        })
    }, []);
    //
    // useEffect(() => {
    //     let tempMap = audioStreamMap.size > 0 ? audioStreamMap : new Map();
    //     audioStreams.forEach((value, index) => {
    //         if ((tempMap.get(parseInt(value)) === undefined) && parseInt(value) !== parseInt(streamId)) {
    //
    //             tempMap.set(parseInt(value), '');
    //             setAudioStreamMap(tempMap);
    //         }
    //         else if ((tempMap.get(parseInt(value)) !== undefined) && (!audioStreams.includes(value))) {
    //             tempMap.get(parseInt(value)).remove();
    //             tempMap.delete(parseInt(value));
    //             setAudioStreamMap(tempMap);
    //         }
    //
    //     });
    //     checkPlayerError();
    //     try{
    //         Array.from(audioStreamMap.keys()).map((key) => {
    //                 if (audioStreamMap.get(key) === '') {
    //                     let tempMap = audioStreamMap;
    //                     let aplayer = OvenPlayer.create('audio' + key, {
    //                         sources: [
    //                             {
    //
    //                                 label: 'label_for_webrtc',
    //                                 // Set the type to 'webrtc'
    //                                 type: 'webrtc',
    //                                 // Set the file to WebRTC Signaling URL with OvenMediaEngine
    //                                 file: 'wss://audio.classiolabs.com/app/' + key
    //
    //                             }
    //                         ], autoStart: true,
    //
    //                         webrtcConfig:
    //                             {
    //                                 timeoutMaxRetry: 100000,
    //                                 connectionTimeout: 50000
    //                             }
    //
    //                     });
    //
    //                     tempMap.set(parseInt(key), aplayer);
    //                     setAudioStreamMap(tempMap);
    //                 }
    //             }
    //         );
    //     }catch (e)
    //     {
    //
    //     }
    // }, [audioStreams])


    useEffect(() => {
        if (mediaStream !== undefined) {
            if (mediaStream.getAudioTracks()[0] !== undefined) {
                if (mic) {

                    mediaStream.getAudioTracks()[0].enabled = true;
                    // sendMuteUnmuteMsg();
                }
                else if (!mic) {


                    mediaStream.getAudioTracks()[0].enabled = false;
                    // sendMuteUnmuteMsg();
                }
            }

        }
    }, [mic])

    function sendMuteUnmuteMsg(val)
    {
        if(val)
        {
            var msg={"type":"unMute"}
            sendRoomMessage(JSON.stringify(msg));
        }else{
            var msg={"type":"mute"}
            sendRoomMessage(JSON.stringify(msg));
        }
    }
    function muteUnmuteMic() {
        if (micAllowed && audioInputDevices.length > 0) {
            if (mic) {
                setMic(false);
                mediaStream.getAudioTracks()[0].enabled = false;
                sendMuteUnmuteMsg(false);
            }
            else {
                setMic(true);
                mediaStream.getAudioTracks()[0].enabled = true;
                sendMuteUnmuteMsg(true);
            }
        }
    }

    const handlePlay = () => {
        player?.play();
        setPause(false);
    }
    const handlePouse = () => {
        player?.pause();
        setPause(true);
    }
    const handleVolumeOn = () => {
        player?.setMute(false);
        try {
            Array.from(audioStreamMap.keys()).map(key => {
                let value = audioStreamMap.get(parseInt(key));
                if (value !== undefined && value !== '' && value.getState() !== 'playing') {
                    value.setMute(false);
                }
            });
        } catch (e) {

        }
    }
    const handleVolumeOff = () => {
        player?.setMute(true);
        try {
            Array.from(audioStreamMap.keys()).map(key => {
                let value = audioStreamMap.get(parseInt(key));
                if (value !== undefined && value !== '' && value.getState() !== 'playing') {
                    value.setMute(true);
                }
            });
        } catch (e) {

        }
    }
    const handleMenu = (event) => {
        setMenuDevice(event.currentTarget);
    };

    const handleClose = () => {
        setMenuDevice(null);
    };
    const handleSetting = (event) => {
        // console.log('quality',player.getQualityLevels());
        setSettingMenu(event.currentTarget);
    }
    const handleSettingClose = () => {
        setSettingMenu(null)
    }
    const handleSettingMenu = (value, option) => {
        setSelectedQuality(option);
        // player.setCurrentSource(value)
        if (option === 'Auto') {
            player.setAutoQuality(true);
        }
        else {
            player.setAutoQuality(false);
            player.getQualityLevels().forEach((object, index) => {
                if (object.label === option) {
                    player.setCurrentQuality(index);
                }
            });
        }

        setSettingMenu(null)
    }
    const handleShowHide = () => {
        setStyle(!style)
    }

    const onMainModalClose = () => {
        // initializeAudioStream();
        connect();
    };
    return (
        <div className="App">
            {
                authUser?.errorCode === 0 ? <>
                    <MainModal fetchMainStream={fetchMainStream} onClose={onMainModalClose}/>
                    <Grid container>
                        {
                            Array.from(audioStreamMap.keys()).map((key, index) => {
                                if (audioStreamMap.get(parseInt(key)) === '') {
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
                                        {/*<div id={'audio' + key}></div>*/}
                                        {React.createElement("div", {id: 'audio' + parseInt(key)})}

                                    </Box>
                                    </Grid>


                                }

                            })
                        }
                    </Grid>
                    <Grid item>
                        <Box height="100vh" display="flex" flexDirection="column" sx={{backgroundColor: "black"}}>
                            <Box onClick={handleShowHide}>
                                <div id="mainStream" style={{position: "relative"}}></div>
                            </Box>
                            <Box sx={{position: "absolute", bottom: "0", left: "0", right: "0"}}>
                                <div style={{display: style ? "block" : "none", background: "rgba(0, 0, 0, 0.35)"}}>
                                    <Button onClick={() => { raiseHand() }}
                                            disabled={moduleSetting?.raiseHand === true ? false : true}>
                                        <PanToolIcon
                                            sx={{color: moduleSetting?.raiseHand === false ? "#cccccc7a" : raisedHandState ? "green" : '#fff'}}/>
                                    </Button>
                                    {!playPause ?
                                        <Button onClick={handlePlay}><PlayArrowIcon sx={{color: '#fff'}}/></Button>
                                        : <Button onClick={handlePouse}>
                                            <Pause sx={{color: '#fff'}}/>
                                        </Button>
                                    }
                                    {
                                        muteUnmutes ? <Button onClick={handleVolumeOn}>
                                            <VolumeOffIcon sx={{color: '#fff'}}/>
                                        </Button> : <Button onClick={handleVolumeOff}>
                                            <VolumeUpIcon sx={{color: '#fff'}}/>
                                        </Button>
                                    }
                                    <Button onClick={() => { muteUnmuteMic() }}>
                                        {
                                            !micAllowed ? <MicOffIcon sx={{color: "#cccccc7a"}}/> :
                                                mic ?
                                                    <MicIcon sx={{color: '#fff'}}/>
                                                    :
                                                    <MicOffIcon sx={{color: '#fff'}}/>
                                        }
                                    </Button>
                                    {/*{*/}
                                    {/*    audioInputDevices?.length > 0 ?*/}
                                    {/*        <Button sx={{marginLeft: "0px", marginTop: "-10px"}}>*/}
                                    {/*            <KeyboardArrowUpIcon onClick={handleMenu} sx={{color: '#fff'}}*/}
                                    {/*                                 fontSize='small'/>*/}
                                    {/*            <Menu*/}
                                    {/*                id="menu-appbar"*/}
                                    {/*                anchorEl={menuDevice}*/}
                                    {/*                getContentAnchorEl={null}*/}
                                    {/*                anchorOrigin={{*/}
                                    {/*                    vertical: 'top',*/}
                                    {/*                    horizontal: 'left',*/}
                                    {/*                }}*/}
                                    {/*                transformOrigin={{*/}
                                    {/*                    vertical: 'bottom',*/}
                                    {/*                    horizontal: 'center',*/}
                                    {/*                }}*/}
                                    {/*                keepMounted*/}
                                    {/*                open={Boolean(menuDevice)}*/}
                                    {/*                onClose={handleClose}*/}
                                    {/*            >*/}
                                    {/*                {*/}
                                    {/*                    audioInputDevices?.length > 0 && audioInputDevices.map((option, i) => {*/}
                                    {/*                        return <MenuItem*/}
                                    {/*                            onClick={() => handleSelectedAudioDevice(option)}*/}
                                    {/*                            key={i}>{option.label === '' ?option.deviceId==='default'?*/}
                                    {/*                                option.deviceId.toLocaleUpperCase():*/}
                                    {/*                            'Device ' + (i + 1) : option.label}</MenuItem>*/}
                                    {/*                    })*/}
                                    {/*                }*/}

                                    {/*            </Menu>*/}
                                    {/*        </Button>*/}
                                    {/*        : ""*/}
                                    {/*}*/}
                                    <Button disabled={moduleSetting?.quality === true ? false : true}>
                                        <SettingsIcon
                                            sx={{color: moduleSetting?.quality === true ? '#fff' : "#cccccc7a"}}
                                            onClick={handleSetting}/>
                                        <Menu
                                            id="menu-appbar"
                                            anchorEl={settingMenu}
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
                                            open={Boolean(settingMenu)}
                                            onClose={handleSettingClose}
                                        >
                                            {
                                                playerQuality?.map((option, i) => {
                                                    return <Box
                                                        sx={{backgroundColor: selectedQuality === option ? 'rgba(25,118,210,0.4)' : 'transparent'}}>
                                                        <MenuItem key={i}
                                                                  onClick={() => handleSettingMenu(i, option)}>{option}</MenuItem></Box>

                                                })
                                            }
                                        </Menu>
                                    </Button>

                                </div>
                            </Box>
                        </Box>
                    </Grid>

                    {/*<Button variant="contained"*/}
                    {/*        onClick={() => muteUnmute()}>{player != undefined && player.getMute() ? "UnMute" : "Mute"}</Button>*/}
                    {/*<Button variant="contained" onClick={() => muteUnmuteMic()}>{mic ? "micon" : "micoff"}</Button>*/}
                    {/*<Button variant="contained" onClick={() => raiseHand()}>raise doubt</Button>*/}
                </> : <>
                    {
                        isLoading ? <Backdrop
                            sx={{color: "aliceblue", zIndex: (theme) => theme.zIndex.drawer + 1}}
                            open={isLoading}
                        >
                            <Circle color={"#fafafa"} size={50}/>
                        </Backdrop> : <ErrorModal/>
                    }

                </>
            }
            <Dialog
                sx={{
                    "& .MuiDialog-container": {
                        "& .MuiPaper-root": {
                            // width: "50%",
                            maxWidth: "100%",
                            maxHeight: "100%",
                            margin: 0,
                        },
                    },
                }}
                open={socketNetworkError}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <Box sx={{mr:8}}>
                <DialogTitle id="alert-dialog-title" sx={{ fontSize: "25px", fontWeight: "bold" }}>
                    {"Network Error !!"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{ fontSize: "15px", fontWeight: "600" }}>
                        Reconnecting ....
                    </DialogContentText>
                </DialogContent>
                </Box>
            </Dialog>
        </div>
    );
}

export default Main;

