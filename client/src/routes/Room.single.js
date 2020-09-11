import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";

const Room = (props) => {
    const hostVideo = useRef();
    const peerRef = useRef();
    const socketRef = useRef();
    const otherUser = useRef();
    const [localUser, setLocalUser] = useState('');
    const [hostUser, setHostUser] = useState('');
    const [roomUsers, setRoomUsers] = useState([]);
    const hostStream = useRef();
    
    useEffect(() => {
        console.log("useEffect")
        socketRef.current = io.connect("/");
        function createPeer(userID) {
            const peer = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: "stun:stun.stunprotocol.org"
                    },
                    {
                        urls: 'turn:numb.viagenie.ca',
                        credential: 'muazkh',
                        username: 'webrtc@live.com'
                    },
                ]
            });
    
            peer.onicecandidate = handleICECandidateEvent;
            peer.ontrack = handleTrackEvent;
            // peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);
    
            return peer;
        }
        function handleRecieveCall(incoming) {
            peerRef.current = createPeer();
            const desc = new RTCSessionDescription(incoming.sdp);
            peerRef.current.setRemoteDescription(desc).then(() => {
                hostStream.current
                    .getTracks()
                    .forEach(
                        track => peerRef.current.addTrack(track, hostStream.current)
                    );
            }).then(() => {
                // return peerRef.current.createAnswer();
            }).then(answer => {
                // return peerRef.current.setLocalDescription(answer);
            }).then(() => {
                // const payload = {
                //     target: incoming.caller,
                //     caller: socketRef.current.id,
                //     sdp: peerRef.current.localDescription
                // }
                // socketRef.current.emit("answer", payload);
            })
        }

        // function callUser(userID) {
        //     peerRef.current = createPeer(userID);
        //     hostStream
        //         .current
        //         .getTracks()
        //         .forEach(
        //             track => peerRef.current.addTrack(track, hostStream.current)
        //         );
        // }

        function handleUserJoined(userID) {
            console.log("handleUserJoined", userID);
            console.log("localUser", localUser)
            // // otherUser.current = userID;
            // hostUser.current = userID;
            setLocalUser(userID);
            // socketRef.current.emit("subscribe", hostVideo);
        }
        console.log(window.location.hostname)
        fetch(`//${window.location.hostname}:8000/rooms`)
            .then(rsp => rsp.json())
            .then(rsp => {
                console.log("fetch", rsp);
                socketRef.current = io.connect("/");
                socketRef.current.on("setHostUser", hostID => {
                    setHostUser(hostID)
                });
                socketRef.current.on("setLocalUser", (id) => {
                    setLocalUser(id);
                });
                socketRef.current.on("setRoomUsers", (users) => {
                    setRoomUsers(users);
                });
                if (!rsp.rooms.hostID) {
                    createHostMedia(socketRef);
                } else {
                    // createGuestMedia(socketRef);
                }
            })
        function createGuestMedia(socketRef) {
            
            socketRef.current.emit("join room", props.match.params.roomID);
            socketRef.current.on("user joined", handleUserJoined);
            socketRef.current.on("notification", (newHostVideo) => {
                hostVideo.current.srcObject = newHostVideo.current.srcObject;
            })
            // socketRef.current.on("other user", userID => {
            //     console.log("otherUser", userID);
            //     callUser(userID);
            //     otherUser.current = userID;
            //     hostUser.current = userID;
            // });
        }
        function createHostMedia(socketRef) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
                hostVideo.current.srcObject = stream;
                // hostStream.current = stream;
    
                
                socketRef.current.emit("join room", props.match.params.roomID);
                
                socketRef.current.on("userJoined", handleUserJoined)
                // // socketRef.current.on("other user", userID => {
                // //     console.log("otherUser", userID);
                // //     callUser(userID);
                // //     otherUser.current = userID;
                // //     hostUser.current = userID;
                // // });
                // socketRef.current.on("setHostUser", (hostUser) => setHostUser(hostUser))
                // socketRef.current.on("user joined", handleUserJoined);
                // socketRef.current.on("offer", handleRecieveCall);
                // // socketRef.current.on("answer", handleAnswer);
                // socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
            });

        }
        

    }, [props.match.params.roomID]);

    // function handleNegotiationNeededEvent(userID) {
    //     peerRef.current.createOffer().then(offer => {
    //         return peerRef.current.setLocalDescription(offer);
    //     }).then(() => {
    //         const payload = {
    //             target: userID,
    //             caller: socketRef.current.id,
    //             sdp: peerRef.current.localDescription
    //         };
    //         // socketRef.current.emit("offer", payload);
    //     }).catch(e => console.log(e));
    // }

    // function handleAnswer(message) {
    //     console.log("handleAnswer", message);
    //     const desc = new RTCSessionDescription(message.sdp);
    //     peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
    // }

    function handleICECandidateEvent(e) {
        if (e.candidate) {
            const payload = {
                target: otherUser.current,
                candidate: e.candidate,
            }
            socketRef.current.emit("ice-candidate", payload);
        }
    }

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        peerRef.current.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    function handleTrackEvent(e) {
        hostVideo.current.srcObject = e.streams[0];
    };

    function List(props) {
        const {items} = props;
        if (items && items.length) {
            return <ul>
                {items.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
        } else {
            return <div>-- No Content --</div>
        }
    }

    return (
        <div>
            <div style={{
                textAlign: "left", 
                width: "600px", 
                marginLeft: "auto", 
                marginRight: "auto",
                padding: "10px"
              }}>
              <div>Room: {props.match.params.roomID}</div>
              <div>Host: {hostUser}</div>
              <div>User: {localUser}</div>
              <div>Users: <List items={roomUsers} /></div>
            </div>
            <video autoPlay muted controls ref={hostVideo} />
        </div>
    );
};

export default Room;