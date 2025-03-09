document.addEventListener("DOMContentLoaded", function () {
    let html5QrCode = null;
    let isCameraActive = false;
    let stream = null;

    // QRコードスキャン成功時の処理
    function onScanSuccess(decodedText, decodedResult) {
        console.log(`QRコードスキャン成功: ${decodedText}`);
        document.getElementById("result").innerText = formatURL(decodedText);
        document.getElementById("result").setAttribute("href", decodedText);

        const regex = /https:\/\/testnets\.opensea\.io\/ja\/assets\/amoy\/([^/]+)\/(\d+)/;
        const match = decodedText.match(regex);

        if (match) {
            const contractAddress = match[1];
            const tokenId = match[2];

            stopCamera();
            alert("読み取りに成功しました。");
            fetchNFTData(contractAddress, tokenId);
        } else {
            alert("このQRコードはTestnetのOpenSeaのNFTではありません。");
        }
    }

    // URLを短縮表示する関数
    function formatURL(url) {
        return url.length > 30 ? url.substring(0, 10) + "..." + url.substring(url.length - 10) : url;
    }

    // OpenSea API から NFT データを取得
    async function fetchNFTData(contractAddress, tokenId) {
        const apiURL = `https://testnets-api.opensea.io/api/v2/chain/amoy/contract/${contractAddress}/nfts/${tokenId}`;

        try {
            const response = await fetch(apiURL);
            if (!response.ok) throw new Error("APIレスポンスエラー");

            const data = await response.json();
            console.log("取得したNFTデータ:", data);

            if (data.nft) {
                let nft = data.nft;
                let imageUrl = nft.display_image_url || nft.image_url || "";
                let name = nft.name || "不明なNFT";
                let description = nft.description || "説明なし";

                document.getElementById("nft-image").src = imageUrl || "";
                document.getElementById("nft-image").style.display = imageUrl ? "block" : "none";
                document.getElementById("nft-name").innerText = `名前: ${name}`;
                document.getElementById("nft-description").innerText = `説明: ${description}`;
            } else {
                alert("NFTデータが見つかりませんでした。");
            }
        } catch (error) {
            console.error("NFTデータの取得エラー:", error);
            alert("NFT情報を取得できませんでした。");
        }
    }

    // カメラON/OFFボタン
    document.getElementById("toggle-camera").addEventListener("click", function () {
        if (isCameraActive) {
            stopCamera();
        } else {
            startCamera();
        }
    });

    // カメラを起動
    async function startCamera() {
        if (html5QrCode) {
            console.log("既にカメラが起動しています。");
            return;
        }

        const qrReaderElement = document.getElementById("qr-reader");
        qrReaderElement.style.display = "block";

        html5QrCode = new Html5Qrcode("qr-reader");

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const backCamera = devices.find(device => device.kind === "videoinput" && device.label.toLowerCase().includes("back"));

            let constraints = {
                video: {
                    deviceId: backCamera ? { exact: backCamera.deviceId } : undefined,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    focusMode: "continuous",  // オートフォーカスを有効にする
                    advanced: [{ focusMode: "continuous" }]
                }
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            html5QrCode.start(
                stream,
                {
                    fps: 15,
                    qrbox: 100,
                    useBarCodeDetectorIfSupported: true
                },
                onScanSuccess
            ).then(() => {
                document.getElementById("toggle-camera").innerText = "📷 カメラをOFFにする";
                isCameraActive = true;
            }).catch(err => {
                console.error("カメラ起動エラー:", err);
                alert("カメラの起動に失敗しました。ブラウザのカメラアクセス設定を確認してください。");
            });

        } catch (err) {
            console.error("カメラアクセスエラー:", err);
            alert("カメラへのアクセスに失敗しました。ブラウザのカメラ設定を確認してください。");
        }
    }

    // カメラを停止
    function stopCamera() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                document.getElementById("toggle-camera").innerText = "📷 カメラをONにする";
                document.getElementById("qr-reader").style.display = "none";
                isCameraActive = false;
                html5QrCode = null;
            }).catch(err => {
                console.error("カメラ停止エラー:", err);
            });
        }

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }
});
