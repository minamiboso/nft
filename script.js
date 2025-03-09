let scanner;
let isCameraActive = false;
let qrScannerElement = document.getElementById("qr-reader");
let cameraSelect = document.getElementById("camera-select");

// カメラリストを取得する関数
function getAvailableCameras() {
    Html5Qrcode.getCameras().then(cameras => {
        if (cameras.length === 0) {
            alert("カメラが見つかりません。");
            return;
        }
        cameraSelect.innerHTML = ""; // 既存のリストをクリア
        cameras.forEach((camera, index) => {
            let option = document.createElement("option");
            option.value = camera.id;
            option.text = camera.label || `カメラ ${index + 1}`;
            cameraSelect.appendChild(option);
        });
    }).catch(err => {
        console.error("カメラリスト取得エラー:", err);
        alert("カメラリストの取得に失敗しました。");
    });
}

// カメラON/OFFボタン
document.getElementById("toggle-camera").addEventListener("click", function() {
    if (isCameraActive) {
        stopCamera();
    } else {
        startCamera();
    }
});

// カメラを起動する関数
function startCamera() {
    scanner = new Html5Qrcode("qr-reader");

    let selectedCameraId = cameraSelect.value || "environment"; // デフォルトで環境カメラ

    let config = {
        fps: 15,  // スキャン速度を上げる
        qrbox: { width: 200, height: 200 },  // PC・スマホ両方に対応
        aspectRatio: 1.0,
        disableFlip: false, // 裏向きのQRコードも認識
        videoConstraints: {
            deviceId: selectedCameraId,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment"
        }
    };

    scanner.start(
        selectedCameraId,
        config,
        onScanSuccess,
        onScanFailure
    ).then(() => {
        document.getElementById("toggle-camera").innerText = "カメラをOFFにする";
        isCameraActive = true;
        qrScannerElement.style.display = "block";
    }).catch(err => {
        console.error("カメラ起動エラー:", err);
        alert("カメラを起動できませんでした。HTTPS環境で実行してください。");
    });
}

// QRコードのスキャン成功時の処理
function onScanSuccess(decodedText, decodedResult) {
    console.log("QRコードスキャン成功:", decodedText);
    document.getElementById("result").innerText = decodedText;
    document.getElementById("result").setAttribute("href", decodedText);
    alert("QRコードをスキャンしました！");
    stopCamera(); // 1回スキャンしたらカメラを止める
}

// QRコードのスキャン失敗時の処理
function onScanFailure(error) {
    console.warn("QRコード未検出:", error);
}

// カメラを停止する関数
function stopCamera() {
    if (scanner) {
        scanner.stop().then(() => {
            isCameraActive = false;
            document.getElementById("toggle-camera").innerText = "カメラをONにする";
            qrScannerElement.style.display = "none";
        }).catch(err => {
            console.error("カメラ停止エラー:", err);
        });
    }
}

// ページ読み込み時にカメラリストを取得
window.onload = getAvailableCameras;
