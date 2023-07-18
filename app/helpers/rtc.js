// const dns = require('dns');
export const getIpAddress = () => {
  return new Promise((resolve, reject) => {
    const rtcPeerConnection = new RTCPeerConnection({ iceServers: [] });

    rtcPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const ipAddress = event.candidate.address;

        // new Buffer(ip.split('.')).readInt32BE(0)
        // console.log('ipppppp',new Buffer.from(ipAddress.split('.')).readInt32BE(0))

        // dns.lookup(ipAddress, { family: dns.constants.AddressFamily.IPv4 }, (err, address) => {
        //     if (err) {
        //       console.error(err);
        //       return;
        //     }
            
        //     console.log(address); // IPv4 address corresponding to the hostname
        // });
        resolve(ipAddress);
    } else {
        reject("Unable to retrieve IP address");
    }

      rtcPeerConnection.onicecandidate = null;
      rtcPeerConnection.close();
    };

    rtcPeerConnection.createDataChannel("");
    rtcPeerConnection
      .createOffer()
      .then((offer) => rtcPeerConnection.setLocalDescription(offer))
      .catch((error) => reject(error));
  });
};


