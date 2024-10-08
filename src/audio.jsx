import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
const Audio = forwardRef(({streamId, user,handleStream}, ref) => {

    const [mixertest, setMixertest] = useState(null);
    const [username, setUsername] = useState(user);
    // const [participants, setParticipants] = useState([]);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [audioSuspended, setAudioSuspended] = useState(false);
    const [webrtcUp, setWebrtcUp] = useState(false);
    const remoteStreamRef = useRef(null);
    // const myRoom = 1234;
    let handle = null;
    console.log('audio','streamId',streamId);

    useImperativeHandle(ref, () => ({
        toggleAudio: toggleAudio,
        toggleMuteUnmute:toggleMuteUnmute
    }));

    useEffect(() => {
        console.log('audio','effect')
        try{

            window.Janus.init({
                debug: "all",
                callback: () => {
                    const janusInstance = new window.Janus({
                        server: 'https://audio.classiolabs.com/janus',
                        iceServers: window.iceServers,
                        // opaqueId:"test",
                        success: () => {
                            // setJanus(janusInstance);
                            attachPlugin(janusInstance);
                            console.error('initializing Janus:');
                        },
                        error: (error) => {
                            console.error('Error initializing Janus:', error);
                        },
                        destroyed: () => {
                            window.location.reload();
                        }
                    });
                }
            });
        }catch(e)
        {


        }    }, []);

    const attachPlugin = (janusInstance) => {
        janusInstance.attach({
            plugin: "janus.plugin.audiobridge",
            success: (pluginHandle) => {
                handle = pluginHandle;
                setMixertest(pluginHandle);

            },
            error: (error) => {
                console.error('Error attaching plugin:', error);
                handleStream(false);
            },
            onmessage: function (msg, jsep) {
                const event = msg.audiobridge;
                if (event) {
                    console.log('event',event);
                    if (event === 'joined') {
                        if (msg.id) {
                            if (!webrtcUp) {
                                setWebrtcUp(true);
                                handle.createOffer({
                                    tracks: [{type: 'audio', capture: true, recv: true}],
                                    success: (jsep) => {
                                        handle.send({message: {request: 'configure', muted: !audioEnabled}, jsep});
                                    },
                                    error: (error) => {
                                        console.error('WebRTC error:', error);
                                    }
                                });
                            }
                        }
                        if (msg.participants) {
                            // setParticipants(msg.participants);
                        }
                        try{

                        handleStream(true);
                        }catch (e)
                        {

                        }
                    }
                    else if (event === 'destroyed') {
                        // alert('Room has been destroyed');
                        try{

                            handleStream(false);
                        }catch (e)
                        {

                        }
                    }
                }
                if (jsep) {
                    handle.handleRemoteJsep({jsep});
                }
            },
            onlocaltrack: (track, on) => handleLocalTrack(track, on),
            onremotetrack: (track, on) => handleRemoteTrack(track, on),
            oncleanup: () => handleCleanup(),
        });
    };

    // Ensure registerUsername only runs when mixertest is available
    useEffect(() => {
        if (mixertest != null) {
            // Call any setup or join actions needed once mixertest is available
            registerUsername();
            console.log("mixertest")
        }
    }, [mixertest]);
    //
    // function handleJanusMessage(msg, jsep) {
    //     const event = msg.audiobridge;
    //     if (event) {
    //         if (event === 'joined') {
    //             if (msg.id) {
    //                 if (!webrtcUp) {
    //                     setWebrtcUp(true);
    //                     mixertest.createOffer({
    //                         tracks: [{type: 'audio', capture: true, recv: true}],
    //                         success: (jsep) => {
    //                             mixertest.send({message: {request: 'configure', muted: !audioEnabled}, jsep});
    //                         },
    //                         error: (error) => {
    //                             console.error('WebRTC error:', error);
    //                         }
    //                     });
    //                 }
    //             }
    //             if (msg.participants) {
    //                 // setParticipants(msg.participants);
    //             }
    //         }
    //         else if (event === 'destroyed') {
    //             alert('Room has been destroyed');
    //         }
    //     }
    //     if (jsep) {
    //         mixertest.handleRemoteJsep({jsep});
    //     }
    // };

    const handleLocalTrack = (track, on) => {
        if (!on) {
            remoteStreamRef.current.srcObject = null;
        }
    };

    const handleRemoteTrack = (track, on) => {
        if (on && track.kind === 'audio') {
            const newStream = new MediaStream([track]);
            remoteStreamRef.current.srcObject = newStream;
        }
    };

    const handleCleanup = () => {
        setWebrtcUp(false);
        // setParticipants([]);
        remoteStreamRef.current.srcObject = null;
    };

    const registerUsername = () => {
        // if (!username) {
        //     alert('Please enter a username');
        //     return;
        // }
        if (!mixertest) {
            console.error('AudioBridge plugin not attached yet.');
            return;
        }
        const register = {request: "join", room: streamId, display: username};
        mixertest.send({message: register});
    };

    const toggleAudio = (muteUnmute) => {
        // setAudioEnabled(!audioEnabled);
        setAudioEnabled(muteUnmute);

        // mixertest.send({message: {request: "configure", muted: audioEnabled}});
        mixertest.send({message: {request: "configure", muted: !muteUnmute}});
    };

    const toggleMuteUnmute = (muteUnmute) => {
        if (muteUnmute) {
            remoteStreamRef.current.play();
        }
        else {
            remoteStreamRef.current.pause();
        }
    };

    const toggleSuspend = () => {
        setAudioSuspended(!audioSuspended);
        mixertest.send({message: {request: audioSuspended ? "resume" : "suspend"}});
    };

    return (
        <>

            <audio ref={remoteStreamRef} controls autoPlay/>
            {/*<ul>*/}
            {/*    {participants.map((participant, index) => (*/}
            {/*        <li key={index}>{participant.display}</li>*/}
            {/*    ))}*/}
            {/*</ul>*/}
        </>
    );
});
export default Audio;
