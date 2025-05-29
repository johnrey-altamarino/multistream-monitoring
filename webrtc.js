let alertSounds = [];
    const alertSound = new Audio('alert.mp3'); // Ensure the path to your alert sound file is correct
    const alertThreshold = 50; // Set a threshold for audio levels

function onEvent(type, data, index) {
    switch (type) {
        case 3:
            console.log((window.performance.now() / 1000).toFixed(3) + `: Stream ${index} event: ` + data);
            break;
        case 2:
            console.log((window.performance.now() / 1000).toFixed(3) + `: Stream ${index} event sdp: ` + data.toString());
            break;
        case 1:
            console.log((window.performance.now() / 1000).toFixed(3) + `: Stream ${index} event caton`);
            triggerConnectionLossAlert(index);
            break;
        case 0:
            console.log((window.performance.now() / 1000).toFixed(3) + `: Stream ${index} event resume`);
            stopConnectionLossAlert(index);
            break;
    }
}

let logs = [];

function logAlert(message, index) {
    // Retrieve the stream name from the input field using the index
    const streamNameInput = document.getElementById(`streamName${index}`);
    const streamName = streamNameInput ? streamNameInput.value : `Stream ${index}`;  // Fallback to Stream Index if not found

    const now = new Date();
    const options = {
        timeZone: 'Asia/Manila', // Replace with your desired time zone
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const timestamp = now.toLocaleString('en-US', options);
    
    // Update the log entry to include the stream name
    const logEntry = `[${timestamp}] ${streamName}: ${message}`;
    console.log(logEntry);
    logs.push(logEntry);  // Store the log entry in the array
}

function generateSdpUrl(appName, streamName, secretKey) {
    const domainName = 'pull.tripledg.live';
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const sdpInputValue = `${secretKey}/${appName}/${streamName}.sdp${currentUnixTime}`;
    const sdpMd5Hash = CryptoJS.MD5(sdpInputValue).toString();
    return `https://${domainName}/${appName}/${streamName}.sdp?wsSecret=${sdpMd5Hash}&wsTime=${currentUnixTime}`;
}

function triggerConnectionLossAlert(index) {
    const videoElement = document.getElementById(`video${index}`);
    const streamBox = videoElement.closest('.stream-box');
    const alertText = streamBox.querySelector('.alert-text');

    alertText.textContent = 'Alert: Connection Lost!';
    alertText.classList.add('show');
    if (alertSounds[index] && alertSounds[index].paused) {
        alertSounds[index].play();
    }
    logAlert('Connection Lost', index);  // Log the connection loss alert
}

function stopConnectionLossAlert(index) {
    const videoElement = document.getElementById(`video${index}`);
    const streamBox = videoElement.closest('.stream-box');
    const alertText = streamBox.querySelector('.alert-text');

    alertText.classList.remove('show');
    if (alertSounds[index]) {
        alertSounds[index].pause();
        alertSounds[index].currentTime = 0; // Reset the sound to the start
    }
    logAlert('Connection Resumed', index);  // Log the connection resume alert
}


function createStreams(rows, cols) {
    const container = document.getElementById('streamsContainer');
    container.innerHTML = ''; // Clear existing streams
    container.setAttribute('data-rows', rows);
    container.setAttribute('data-cols', cols);

    const totalStreams = rows * cols;
    for (let i = 1; i <= totalStreams; i++) {
        const streamBox = document.createElement('div');
        streamBox.className = 'stream-box';

        const streamContent = document.createElement('div');
        streamContent.className = 'stream-content';

        const video = document.createElement('video');
        video.id = `video${i}`;
        video.controls = false;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        streamContent.appendChild(video);

        const audioMeter = document.createElement('div');
        audioMeter.className = 'audio-meter';

        const leftBar = document.createElement('div');
        leftBar.className = 'bar';
        const rightBar = document.createElement('div');
        rightBar.className = 'bar';

        audioMeter.appendChild(leftBar);
        audioMeter.appendChild(rightBar);

        streamContent.appendChild(audioMeter);

        const alertText = document.createElement('div');
        alertText.className = 'alert-text';
        alertText.textContent = 'Alert: High Audio Level Detected!';
        streamBox.appendChild(alertText);

        // Add bitrate status
        const bitrateStatus = document.createElement('div');
        bitrateStatus.className = 'bitrate-status';
        bitrateStatus.textContent = 'Bitrate: N/A';
        streamContent.appendChild(bitrateStatus);

        const controls = document.createElement('div');
        controls.className = 'controls';

        //const input = document.createElement('input');
        //input.type = 'text';
        //input.className = 'form-control';
        //input.placeholder = `Signal URL for Stream ${i}`;
        //input.value = `http://livep2p-pull.8686c.com/live/cctest${i}.sdp`;
        //input.id = `signal_url${i}`;
        //controls.appendChild(input);

        const appNameInput = document.createElement('input');
        appNameInput.type = 'text';
        appNameInput.placeholder = 'App Name';
        appNameInput.id = `appName${i}`;
        appNameInput.value =`TDGI`;
        controls.appendChild(appNameInput);

        const streamNameInput = document.createElement('input');
        streamNameInput.type = 'text';
        streamNameInput.placeholder = 'Stream Name';
        streamNameInput.id = `streamName${i}`;
        streamNameInput.value =`FTF-${i}`;
        controls.appendChild(streamNameInput);

        const secretKeyInput = document.createElement('input');
        secretKeyInput.type = 'password';
        secretKeyInput.placeholder = 'Secret Key';
        secretKeyInput.id = `secretKey${i}`;
        controls.appendChild(secretKeyInput);

        const playBtn = document.createElement('button');
        playBtn.className = 'btn btn-success';
        playBtn.textContent = 'Play';
        playBtn.onclick = function() {
            playStream(i);
        };
        controls.appendChild(playBtn);

        const stopBtn = document.createElement('button');
        stopBtn.className = 'btn btn-danger';
        stopBtn.textContent = 'Stop';
        stopBtn.onclick = function() {
            stopStream(i);
            alertText.classList.remove('show');
            alertSound.pause();
            alertSound.currentTime = 0;
        };
        controls.appendChild(stopBtn);

        streamContent.appendChild(controls);
        streamBox.appendChild(streamContent);
        container.appendChild(streamBox);
    }

    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, auto)`; // Adjust row height based on content
    createGlobalControls(rows * cols);
}

function createGlobalControls(totalStreams) {
    const globalControls = document.getElementById('globalControls');
    globalControls.innerHTML = ''; // clear old buttons

    const playAllBtn = document.createElement('button');
    playAllBtn.className = 'btn btn-success';
    playAllBtn.textContent = 'Play All';
    playAllBtn.onclick = function () {
        for (let i = 1; i <= totalStreams; i++) {
            playStream(i);
        }
    };

    const stopAllBtn = document.createElement('button');
    stopAllBtn.className = 'btn btn-danger';
    stopAllBtn.textContent = 'Stop All';
    stopAllBtn.onclick = function () {
        for (let i = 1; i <= totalStreams; i++) {
            stopStream(i);

            const alertText = document.querySelector(`#video${i}`).closest('.stream-box').querySelector('.alert-text');
            if (alertText) alertText.classList.remove('show');

            const alertSound = document.getElementById('alertSound');
            if (alertSound) {
                alertSound.pause();
                alertSound.currentTime = 0;
            }
        }
    };

    globalControls.appendChild(playAllBtn);
    globalControls.appendChild(stopAllBtn);
}

let players = [];
let alerts = [];
let audioContexts = [];
let analysers = [];

function playStream(index) {
    stopStream(index);
    if (players[index]) {
        players[index].close(); // Close existing player if any
    }

    const videoElement = document.getElementById(`video${index}`);
    const appName = document.getElementById(`appName${index}`).value;
    const streamName = document.getElementById(`streamName${index}`).value;
    const secretKey = document.getElementById(`secretKey${index}`).value;

    const signalUrl = generateSdpUrl(appName, streamName, secretKey);

    const option = {
        element: videoElement,
        customerID: "bjweimiao",
        listener: (type, data) => onEvent(type, data, index)
    };

    const player = window.wsrtcplayer.createWSRTCPlayer(option);
    player.open(signalUrl);
    players[index] = player;

    // Log whether the connection is successfully made
    videoElement.onloadeddata = () => {
        console.log(`Stream ${index} loaded successfully`);
        const stream = videoElement.srcObject;
        if (stream) {
            // Check for audio and video tracks
            checkStreamTracks(stream, index);
            // Start monitoring after tracks are checked
            monitorStream(index, stream);
        } else {
            console.error(`Stream ${index} has no media.`);
        }
    };
}

function stopStream(index) {
    if (players[index]) {
        players[index].close();
        players[index] = null;
    }

    const videoElement = document.getElementById(`video${index}`);
    const streamBox = videoElement.closest('.stream-box');
    const alertText = streamBox.querySelector('.alert-text');

    if (alertText) {
        alertText.classList.remove('show');
    }

    // Stop the alert sound if it's playing
    if (alertSounds[index] && !alertSounds[index].paused) {
        alertSounds[index].pause();
        alertSounds[index].currentTime = 0; // Reset the sound to the beginning
    }

    // Remove the alert sound from the array
    if (alertSounds[index]) {
        alertSounds[index] = null;
    }

    // Stop monitoring
    if (alerts[index]) {
        clearInterval(alerts[index]);
        alerts[index] = null;
    }

    // Stop audio context
    if (audioContexts[index]) {
        audioContexts[index].close();
        audioContexts[index] = null;
    }

    // Remove event listeners
    if (videoElement) {
        videoElement.onerror = null;
        videoElement.ontimeupdate = null;
    }
}


function monitorStream(index, stream, alertSoundPath = 'alert.mp3') {
    const videoElement = document.getElementById(`video${index}`);
    const streamBox = videoElement.closest('.stream-box');
    const alertText = streamBox.querySelector('.alert-text');
    const audioMeter = streamBox.querySelector('.audio-meter');
    const bitrateStatus = streamBox.querySelector('.bitrate-status');

    const audioContext = new(window.AudioContext || window.webkitAudioContext)();
    let source;
    let lastBytesSent = 0;
    let lastTimestamp = 0;

    if (stream.getAudioTracks().length > 0) {
        source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);

        analyser.fftSize = 128; // Lower fftSize for faster processing
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let noAudioDuration = 0;
        let blackScreenDuration = 0;
        const alertDuration = 100; // 100 milliseconds

        alertSounds[index] = new Audio(alertSoundPath); // Store in alertSounds array
        alertSounds[index].loop = true;


        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;

        function checkStream() {
            analyser.getByteFrequencyData(dataArray);

            const leftChannelData = [];
            const rightChannelData = [];

            for (let i = 0; i < bufferLength; i += 2) {
                leftChannelData.push(dataArray[i]);
                rightChannelData.push(dataArray[i + 1]);
            }

            const leftChannelSum = leftChannelData.reduce((a, b) => a + b, 0);
            const rightChannelSum = rightChannelData.reduce((a, b) => a + b, 0);

            const leftChannelAvg = leftChannelSum / leftChannelData.length;
            const rightChannelAvg = rightChannelSum / rightChannelData.length;

            const scaleAudioLevel = level => Math.min(100, Math.log10(1 + level) * 35);

            const leftLevel = scaleAudioLevel(leftChannelAvg);
            const rightLevel = scaleAudioLevel(rightChannelAvg);

            const leftBar = audioMeter.querySelector('.bar:first-child');
            const rightBar = audioMeter.querySelector('.bar:last-child');

            if (leftBar && rightBar) {
                leftBar.style.height = `${leftLevel}%`;
                rightBar.style.height = `${rightLevel}%`;
            }

            if (leftLevel < 5 && rightLevel < 5) {
                noAudioDuration += 100; // Increment by 100 milliseconds
            } else {
                noAudioDuration = 0; // Reset counter if audio is detected
            }

            if (noAudioDuration >= alertDuration) {
                alertText.textContent = 'Alert: No Audio Detected!';
                alertText.classList.add('show');
                if (alertSounds[index].paused) {
                    alertSounds[index].play(); // Play the alert sound if it's not already playing
                    logAlert('No Audio Detected', index);  // No Audio Detected! alert
                }
            } else {
                alertText.classList.remove('show');
                alertSound.pause();
                alertSound.currentTime = 0;
            }

            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let totalLuminance = 0;

            for (let i = 0; i < frameData.length; i += 4) {
                const r = frameData[i];
                const g = frameData[i + 1];
                const b = frameData[i + 2];
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLuminance += luminance;
            }

            const avgLuminance = totalLuminance / (frameData.length / 4);

            if (avgLuminance < 10) {
                blackScreenDuration += 100;
            } else {
                blackScreenDuration = 0;
            }

            if (blackScreenDuration >= alertDuration) {
                alertText.textContent = 'Alert: Black Screen Detected!';
                alertText.classList.add('show');
                if (alertSound.paused) {
                    alertSound.play();
                    logAlert('Black Screen Detected', index);  // Black Screen Detected! alert
                }
            } else if (noAudioDuration < alertDuration) {
                alertText.classList.remove('show');
                alertSound.pause();
                alertSound.currentTime = 0;
            }
        }

        alerts[index] = setInterval(checkStream, 100);

        audioContexts[index] = audioContext;
        analysers[index] = analyser;
    } else {
        console.log(`Stream ${index} has no audio track`);
        logAlert('Stream has no audio track', index);  // Log no audio track alert
    }

    // Function to update the bitrate status updated bitrate drops and stalls
    async function updateBitrateStatus() {
    const pc = players[index] && players[index]._pc;  // Ensure we access the peer connection
    if (pc) {
        const stats = await pc.getStats();
        let foundInboundRTP = false;
        stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                foundInboundRTP = true;
                const bytesReceived = report.bytesReceived;
                const now = report.timestamp;
    
                if (lastBytesSent && lastTimestamp) {
                    const bitrate = (bytesReceived - lastBytesSent) * 8 / ((now - lastTimestamp) / 1000); // bits per second
                    bitrateStatus.textContent = `Bitrate: ${Math.round(bitrate / 1000)} kbps`;
                    if (bitrate <= 100) {  // Low bitrate threshold Updated to 100 kbps below
                        alertText.textContent = 'Alert: Low Bitrate Detected!';
                        alertText.classList.add('show');
                        if (alertSound.paused) {
                            alertSound.play();
                            logAlert('Low Bitrate Detected', index);  // Log low bitrate
                        }
                    }
                }
                lastBytesSent = bytesReceived;
                lastTimestamp = now;
            }
        });
        if (!foundInboundRTP) {
            console.log("No inbound-rtp stats found for video");
        }
    } else {
        console.log("No PeerConnection found for this stream.");
    }
}

    // Set an interval to update the bitrate status every second (1000 milliseconds)
    setInterval(updateBitrateStatus, 1000);

    // Add error handling for video decoding Updated alerts
    videoElement.onerror = (e) => {
    const errorType = e.target.error ? e.target.error.code : 0;
    let errorMessage;
    switch (errorType) {
        case 1:
            errorMessage = 'Alert: Video Decoding Aborted!';
            break;
        case 2:
            errorMessage = 'Alert: Network Error during Video Fetch!';
            break;
        case 3:
            errorMessage = 'Alert: Decoding Error!';
            break;
        case 4:
            errorMessage = 'Alert: Video Format Not Supported!';
            break;
        default:
            errorMessage = 'Alert: Unknown Video Error!';
    }
    alertText.textContent = errorMessage;
    alertText.classList.add('show');
    if (alertSounds[index].paused) {
        alertSounds[index].play();
        logAlert(errorMessage, index);
    }
    // added audio- video sync issue
    videoElement.ontimeupdate = () => {
    if (Math.abs(videoElement.currentTime - audioContext.currentTime) > 0.5) {
        alertText.textContent = 'Alert: Audio-Video Sync Issue Detected!';
        alertText.classList.add('show');
        if (alertSound.paused) {
            alertSound.play();
            logAlert('Audio-Video Sync Issue', index);
        }
    }
};
};

    // Add event listener for video decoding errors
    videoElement.addEventListener('error', (e) => {
        console.error('Video element error:', e);
        alertText.textContent = 'Alert: Video Error Detected!';
        alertText.classList.add('show');
        if (alertSound.paused) {
            alertSound.play(); // Play the alert sound if it's not already playing
            logAlert('Video Error Detected', index);  // Video Error Detected alert
        }
    });

    videoElement.onpause = () => {
        checkStream();
    };
}

function checkStreamTracks(stream, index) {
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();

    if (audioTracks.length > 0) {
        console.log(`Stream ${index} has audio`);
    } else {
        console.error(`Stream ${index} has no audio`);
    }

    if (videoTracks.length > 0) {
        console.log(`Stream ${index} has video`);
    } else {
        console.error(`Stream ${index} has no video`);
    }
}

function downloadLogs() {
    const logContent = logs.join('\n'); // Join logs into a single string with line breaks
    const now = new Date();             // Added date and time to filename when exported
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const timestamp = now.toLocaleString('en-US', options)
                        .replace(/[/,:]/g, '-'); // Replace invalid characters for filenames

    const filename = `Monitoring-Logs-${timestamp}.txt`;
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url); // Clean up the URL object
}


document.getElementById('setLayout').addEventListener('click', function() {
    const rows = parseInt(document.getElementById('numRows').value, 10);
    const cols = parseInt(document.getElementById('numCols').value, 10);
    createStreams(rows, cols);
});

// Initialize with 2 rows and 3 columns
createStreams(2, 4);