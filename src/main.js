import './App.css';
import OvenPlayer from 'ovenplayer';
import { forwardRef, useEffect, useRef, useState } from "react";
import {
    Backdrop,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    Menu,
    MenuItem,
    Snackbar
} from "@mui/material";
import OvenLiveKit from 'ovenlivekit'
import { useLocation, useParams, useSearchParams } from "react-router-dom";
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
import Audio from "./audio";



var React = require('react');

// const STUDENT_DETAIL_URL = "https://api.softkitesinfo.com/student/fetch-details";
// const FETCH_INSTITUTE_URL = "https://api.softkitesinfo.com/getMetaData/fetch-institute"
const STUDENT_DETAIL_URL = "https://prodapi.classiolabs.com/student/fetch-details";
const FETCH_INSTITUTE_URL = "https://prodapi.classiolabs.com/getMetaData/fetch-institute"

export default function Main(){
    const [player, setPlayer] = useState();
    const {liveId, userId} = useParams();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = searchParams.get('token');
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
        "Auto", "720p", "480p", "360p", "240p"
    ]
    const [selectedQuality, setSelectedQuality] = useState("Auto");
    const [pause, setPause] = useState(false);
    const [instituteList, setInstituteList] = useState([]);
    const [allowStudentListen,setAllowStudentListen]=useState(true);
    const moduleSetting = instituteList?.institute?.instituteModuleSetting;

    const [participants, setParticipants] = useState([]);
    // const [roomPing, setRoomPing] = useState(Date.now());

    const [socketNetworkError, setSocketNetworkError] = useState({
        open: false,
        vertical: 'top',
        horizontal: 'center',
      });
      const { vertical, horizontal, open } = socketNetworkError;
    const [streaming, setStreaming] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [enabledHandRaise, setEnableHandRaise] = useState(false);
    const workerRef = useRef(null);
    const audioRef=useRef(null);
    useEffect(() => {
        workerRef.current = new Worker(new URL('./websocketworker.jsx', import.meta.url));


        connectWebsocket();
        let metaObject = {};
        metaObject.type = 'meta';
        metaObject.userId = userId;
        workerRef.current.postMessage(metaObject);
        // if (streaming !== true && roomSocketUrl !== "") {
        //     initializeAudioStream();
        // }
    }, [])


    if (workerRef.current !== undefined && workerRef.current !== null) {
        workerRef.current.onmessage = function (event) {
            let message = event.data;
            if (message.type === 'websocketMessage') {
                handleWebsocketMessage(message.data);
            }
            if (message.type === 'websocketError') {
                setSocketNetworkError({
                    open: message.data,
                    vertical: 'top',
                    horizontal: 'center',
                  });

                setAvailable(false);
                if(message.data)
                {
                    // checkAudioStream();
                }
            }

        };
    }

    function connectWebsocket() {
        var startObject = {};
        startObject.type = 'start';
        startObject.data = "wss://prodapi.classiolabs.com/ws/room/" + liveId + "/" + userId + "/false";
        workerRef.current.postMessage(startObject);
    }

    function sendRoomMessage(data) {
        var object = {};
        object.type = "send";
        object.data = data;
        workerRef.current.postMessage(object);
    }

    useEffect(() => {

        if (mediaStream !== undefined) {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();

            const microphone = audioContext.createMediaStreamSource(mediaStream);

            analyser.smoothingTimeConstant = 0.1;
            analyser.fftSize = 512;

            microphone.connect(analyser);

            const audioInterval = setInterval(() => {

                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                const arraySum = array.reduce((a, value) => a + value, 0);
                const average = arraySum / array.length;
                if (average > 10) {
                    var msg = {"type": "audioLevel", "data": average};
                    sendRoomMessage(JSON.stringify(msg));
                }

            }, 500);
        }

    }, [mediaStream])
    // useEffect(() => {
    //     if (participants.length > 0) {
    //         participants.forEach((items) => {
    //             console.log('participant',parseInt(items.userId),parseInt(userId),parseInt(items.userId) === parseInt(userId))
    //             if (parseInt(items.userId) === parseInt(userId)) {
    //
    //                 console.log('items',items)
    //                 if (micAllowed !== items.micAllow) {
    //                     setMicAllowed(items.micAllow);
    //                 }
    //
    //                 if (micAllowed !== items.micAllow && items.micAllow === true) {
    //                     setRaisedHandState(false);
    //                     var msg = {"type": "unRaise"};
    //                     sendRoomMessage(JSON.stringify(msg));
    //                 }
    //
    //
    //                 if (streamId === "") {
    //                     setStreamId(items.audioStreamId);
    //                 }
    //
    //                 if (micAllowed === false) {
    //                     setMic(false);
    //                 }
    //                 else {
    //                     setMic(!items.mute);
    //                 }
    //             }
    //         })
    //     }
    //
    // }, [participants])


    useEffect(() => {
        // if (!available && streamId !== "" && socketNetworkError !== true) {
        //     initializeAudioStream();
        // }
    }, [streamId])
    // useEffect(() => {
    //
    //
    //     // if (streaming !== true && roomSocketUrl !== "") {
    //     //     console.log("useeffect stream", streaming, roomSocketUrl);
    //     //     initializeAudioStream();
    //     // }
    //     const timer = setTimeout(() => ticking && setCount(count + 1), 2e3);
    //     return () => clearTimeout(timer);
    // }, [count, ticking]);


    useEffect(() => {
        checkPlayerError();
        StudentFetchDetail();
        getInstituteDetail();
        try{
            const script = document.createElement("script");

            script.src = "janus.js";
            script.async = false;

            document.body.appendChild(script);
        }catch (e)
        {
            console.log('screrror',e);
        }

    }, [])


    function sendPing() {
        console.log('ping');
        // if (!socketNetworkError) {
            var object = {"type": "ping"};
            sendRoomMessage(JSON.stringify(object));
        // }

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
            if (player !== undefined) {
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
    }

    // let ovenLivekit = OvenLiveKit.create({
    //     callbacks: {
    //         error: function (error) {
    //             console.log("stream error", error);
    //             // setStreaming(false);
    //             // setMic(false);
    //             setConnecting(false);
    //             setAvailable(false);
    //         },
    //         connected: function (event) {
    //             // console.log("event", event);
    //             // ovenLivekit.inputStream.getAudioTracks()[0].enabled;
    //             // setStreaming(true);
    //             setAvailable(true);
    //         },
    //         connectionClosed: function (type, event) {
    //             console.log("stream close", type, event);
    //             // setStreaming(false);
    //             // setMic(false);
    //             // initializeAudioStream();
    //             setAvailable(false);
    //         },
    //         iceStateChange: function (state) {
    //             console.log("stream state", state);
    //             try {
    //                 if (state === 'connected') {
    //                     // addStream();
    //                     setAvailable(true);
    //                     setConnecting(false);
    //                     // setMicAllowed(true);
    //                     setRaisedHandState(false);
    //                     setStreaming(true);
    //                 }
    //                 else if (state === 'closed' || state === 'failed' || state === 'disconnected') {
    //                     console.log("stream failed");
    //                     setAvailable(false);
    //                     // initializeAudioStream();
    //                     setStreaming(false);
    //                     setConnecting(false);
    //                     setMic(false);
    //                     // checkAudioStream();
    //                 }
    //             } catch (e) {
    //                 console.log("stream",e);
    //                 setAvailable(false);
    //                 setStreaming(false);
    //                 setConnecting(false);
    //                 setMic(false);
    //
    //             }
    //         }
    //     }
    // });


    function handleWebsocketMessage(data) {
        checkVideo();
        sendPing();

        if(data.userId!=null)
        {
            try{
                if (micAllowed !== data.micAllow) {
                    setMicAllowed(data.micAllow);

                }

                if (micAllowed !== data.micAllow && data.micAllow === true) {
                    setRaisedHandState(false);
                    var msg = {"type": "unRaise"};
                    sendRoomMessage(JSON.stringify(msg));
                }


                if (streamId === "") {
                    setStreamId(data.audioStreamId);
                }

                if (micAllowed === false) {
                    setMic(false);
                }
                else {
                    setMic(!data.mute);
                }
            }catch (e)
            {

            }
        }
        // if (data.type === "students") {
        //     setParticipants(data.students);
        //     try {
        //         setEnableHandRaise(data.allowHandRaise);
        //     } catch (e) {
        //
        //     }
        //
        // }
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
            let streamId = parseInt(data.stream);
            setMainStreamId(streamId);
            loadPlayer(streamId);
            // checkAudioStream();

        }
        if (data.type === 'micAllowed') {
            if (available) {
                setMic(false);
                setMicAllowed(true);
                setRaisedHandState(false);
            }


        }
        if (data.type === 'micDisallowed') {
            setMic(false);
            setMicAllowed(false);
            // removeStream();

        }
        if (data.command === 'broadcastStream') {
            console.log(data, streamId, data.userId, userId);

            if (!(data.userId.toString() === userId)) {
                setAudioStreams([...audioStreams, data.streamId]);
            }

        }


    }

    // function checkAudioStream()
    // {
    //     if (!available && !connecting && micAllowed) {
    //         ovenLivekit.remove();
    //         // initializeAudioStream();
    //         setTimeout(initializeAudioStream(),4000);
    //     }
    // }



    // function initializeAudioStream() {
    //     console.log('connectings', connecting,available, streamId);
    //     if (connecting === false && available===false ) {
    //         if (streamId !== "") {
    //             try {
    //
    //                 ovenLivekit.getUserMedia({
    //                     audio: {sampleSize: 8},
    //                     video: true
    //                 }).then(function (stream) {
    //                     setMediaStream(stream);
    //                     setConnecting(true);
    //                     ovenLivekit.startStreaming('wss://audio.classiolabs.com/app/' + streamId + '?direction=send&transport=tcp');
    //
    //                     stream.getVideoTracks().forEach(value => {
    //                         value.enabled = false;
    //                     })
    //                     // stream.getAudioTracks().forEach((device)=>{
    //                     //     device.enabled=false;
    //                     // })
    //
    //                     // addStream();
    //
    //                 });
    //             } catch (e) {
    //                 console.log(e);
    //                 setConnecting(false);
    //             }
    //             setConnecting(false);
    //         }
    //     }
    //
    // }

    function fetchMainStream() {
        var msg = {"type": "fetchMainStream"};
        sendRoomMessage(JSON.stringify(msg));

    }

    // function fetchAudioStreams() {
    //     var msg = { "type": "fetchStreams" };
    //     sendRoomMessage(JSON.stringify(msg));
    // }

    useEffect(() => {
        // if (player != undefined)
        //     player.setMute(true);


    }, [player])

    function loadPlayer(stream) {

        console.log('loadoplayer', stream);
        const videoPlayer = OvenPlayer.create('mainStream', {
            sources: [
                {

                    label: '4k',
                    // Set the type to 'webrtc'
                    type: 'webrtc',
                    // Set the file to WebRTC Signaling URL with OvenMediaEngine
                    file: 'wss://stream.classiolabs.com/live/' + stream + '/abr'
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

        videoPlayer.on('stateChanged', function (data) {
            if (data?.newstate === "playing") {
                setPlayPause(true)

            }
            else {
                setPlayPause(false)

            }
            toggleAudioPlayerMute(muteUnmutes);

        })
        videoPlayer.on('mute', function (data) {
            if (data?.mute === true) {
                setMuteUnmutes(true)
                toggleAudioPlayerMute(true);
            }
            else {
                setMuteUnmutes(false)
                toggleAudioPlayerMute(false);
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

    function toggleAudioPlayerMute(muteUnmute)
    {
        try{
            if(allowStudentListen)
            {
            audioRef.current.toggleMuteUnmute(muteUnmute);
            }else{
                audioRef.current.toggleMuteUnmute(false);
            }
        }catch (e)
        {

        }
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
    //
    // useEffect(() => {
    //     navigator.mediaDevices.enumerateDevices().then(devices => {
    //         console.log(devices);
    //         let newArr = [];
    //         devices.forEach(device => {
    //             if (device) {
    //                 if ((device.deviceId !== '' || device.deviceId !== undefined) && device.kind == 'audioinput') {
    //
    //                     newArr.push(device)
    //                     setAudioInputDevices(newArr)
    //                 }
    //             }
    //         })
    //     })
    // }, []);
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
            if (micAllowed && mic === true) {
                enableAudioStream();
            }
            else {
                disableAudioStream();
            }
        }
    }, [mediaStream])

    useEffect(() => {
        try {
            if (mediaStream !== undefined) {
                if (mic) {

                    // mediaStream.getAudioTracks()[0].enabled = true;
                    // sendMuteUnmuteMsg();
                    enableAudioStream();
                }
                else if (!mic) {


                    // mediaStream.getAudioTracks()[0].enabled = false;
                    // sendMuteUnmuteMsg();
                    disableAudioStream();
                }
            }

            if (streaming === false) {
                setMic(false);
                disableAudioStream();
                // sendMuteUnmuteMsg(false);
            }

        } catch (e) {

        }

    }, [mic])


    function enableAudioStream() {
        // try {
        //     if (mediaStream !== undefined) {
        //
        //         mediaStream.getAudioTracks().forEach((device) => {
        //             try {
        //                 device.enabled = true;
        //             } catch (e) {
        //                 console.log('error', e);
        //             }
        //         })
        //     }
        // } catch (e) {
        //     console.log('error', e);
        //
        // }
        audioRef.current.toggleAudio(true);
    }

    function disableAudioStream() {
        // try {
        //     if (mediaStream !== undefined) {
        //         mediaStream.getAudioTracks().forEach((device) => {
        //             try {
        //                 device.enabled = false;
        //             } catch (e) {
        //                 console.log('error', e);
        //
        //             }
        //         })
        //     }
        // } catch (e) {
        //     console.log('error', e);

        // }
        audioRef.current.toggleAudio(false);
    }

    function sendMuteUnmuteMsg(val) {
        if (val) {
            var msg = {"type": "unMute"}
            sendRoomMessage(JSON.stringify(msg));
        }
        else {
            var msg = {"type": "mute"}
            sendRoomMessage(JSON.stringify(msg));
        }
    }

    function muteUnmuteMic() {
        console.log("mute umute press")
        if (micAllowed) {
            if (mic) {
                setMic(false);
                disableAudioStream();
                // mediaStream.getAudioTracks()[0].enabled = false;

                sendMuteUnmuteMsg(false);

            }
            else {
                setMic(true);
                // mediaStream.getAudioTracks()[0].enabled = true;
                enableAudioStream();
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
        // try {
        //     // Array.from(audioStreamMap.keys()).map(key => {
        //     //     let value = audioStreamMap.get(parseInt(key));
        //     //     if (value !== undefined && value !== '' && value.getState() !== 'playing') {
        //     //         value.setMute(false);
        //     //     }
        //     // });
        // } catch (e) {
        //
        // }
        toggleAudioPlayerMute(false);
    }
    const handleVolumeOff = () => {
        player?.setMute(true);
        // try {
        //     Array.from(audioStreamMap.keys()).map(key => {
        //         let value = audioStreamMap.get(parseInt(key));
        //         if (value !== undefined && value !== '' && value.getState() !== 'playing') {
        //             value.setMute(true);
        //         }
        //     });
        // } catch (e) {
        //
        // }
        toggleAudioPlayerMute(true);
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
     function handleStream(started)
    {
        console.log('handle stream',started)
        setStreaming(started);

    }    const handleSettingClose = () => {
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
        // connect();
    };

    // console.log('moduleSetting', moduleSetting);
    return (
        <div className="App">
            {/*<Helmet>*/}
            {/*    <script src="janus.js"></script>*/}
            {/*</Helmet>*/}
            {
              authUser!=='' &&   authUser?.errorCode === 0 ?
                    <>
                    <MainModal fetchMainStream={fetchMainStream} onClose={onMainModalClose}/>
                    {/*<Grid container>*/}
                    {/*    {*/}
                    {/*        Array.from(audioStreamMap.keys()).map((key, index) => {*/}
                    {/*            if (audioStreamMap.get(parseInt(key)) === '') {*/}
                    {/*                return <Grid item key={index}> <Box*/}
                    {/*                    sx={{*/}
                    {/*                        width: 0,*/}
                    {/*                        height: 0,*/}
                    {/*                        backgroundColor: 'primary.dark',*/}
                    {/*                        '&:hover': {*/}
                    {/*                            backgroundColor: 'primary.main',*/}
                    {/*                            opacity: [0.9, 0.8, 0.7],*/}
                    {/*                        },*/}
                    {/*                    }}*/}
                    {/*                >*/}
                    {/*                    /!*<div id={'audio' + key}></div>*!/*/}
                    {/*                    {React.createElement("div", {id: 'audio' + parseInt(key)})}*/}

                    {/*                </Box>*/}
                    {/*                </Grid>*/}


                    {/*            }*/}

                    {/*        })*/}
                    {/*    }*/}
                    {/*</Grid>*/}
                    {mainStreamId!==null && mainStreamId!==undefined && <div style={{width:0,height:0,visibility:'hidden'}}><Audio streamId={mainStreamId} userId={userId} ref={audioRef} handleStream={handleStream}/></div>}
                    <Grid item>
                        <Box height="100vh" display="flex" flexDirection="column" sx={{backgroundColor: "black"}}>
                            <Box onClick={handleShowHide}>
                                <div id="mainStream" style={{position: "relative"}}></div>
                            </Box>
                            <Box sx={{position: "absolute", bottom: "0", left: "0", right: "0"}}>
                                <div style={{display: style ? "block" : "none", background: "rgba(0, 0, 0, 0.35)"}}>
                                    <Button onClick={() => { raiseHand() }}
                                            disabled={moduleSetting?.raiseHand === true || enabledHandRaise === true ? false : true}>
                                        <PanToolIcon
                                            sx={{color: moduleSetting?.raiseHand === false || enabledHandRaise === false ? "#cccccc7a" : raisedHandState ? "green" : '#fff'}}/>
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
                                            (micAllowed === false) ? <MicOffIcon sx={{color: "#cccccc7a"}}/> :
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
                {/*</div> : <>*/}
                        {
                            isLoading ? <Backdrop
                                sx={{color: "aliceblue", zIndex: (theme) => theme.zIndex.drawer + 1}}
                                open={isLoading}
                            >
                                <Circle color={"#fafafa"} size={50}/>
                            </Backdrop> : <div></div>
                        }

                    </>:<ErrorModal/>
            }
             <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        message={<Box sx={{textAlign: "left"}}><h4 style={{margin: 0}}>Your network connection is unstable</h4><p>Trying to Reconnect</p></Box>}
        key={vertical + horizontal}
      />
            {/* <Dialog
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
                <Box sx={{mr: 8}}>
                    <DialogTitle id="alert-dialog-title" sx={{fontSize: "25px", fontWeight: "bold"}}>
                        {"Your network connection is weak"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description" sx={{fontSize: "15px", fontWeight: "600"}}>
                            Trying to Reconnect
                        </DialogContentText>
                    </DialogContent>
                </Box>
            </Dialog> */}
        </div>
    );
};

