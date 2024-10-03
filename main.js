const x = document.getElementById("demo");
let latitude, longitude;
let db;

const request = indexedDB.open("GeolocationDB", 1);
request.onerror = (event) => {
    console.error("Ошибка при открытии базы данных:", event);
};
request.onsuccess = (event) => {
    db = event.target.result;
    displayIndexedDB();
};
request.onupgradeneeded = (event) => {
    db = event.target.result;
    db.createObjectStore("locations", { keyPath: "id", autoIncrement: true });
};

function getLocation(){
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else{ 
        x.innerHTML = "Геолокация не поддерживается вашим браузером";
    }
}

function showPosition(position){
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    x.innerHTML = `Широта: ${latitude}<br>Долгота: ${longitude}`;
}

function showError(error){
    switch(error.code) {
        case error.PERMISSION_DENIED:
            x.innerHTML = "Пользователь отклонил запрос";
            break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML = "Информация местоположения недоступна";
            break;
        case error.TIMEOUT:
            x.innerHTML = "Ожидание запроса превышено";
            break;
        case error.UNKNOWN_ERROR:
            x.innerHTML = "Неизвестная ошибка";
            break;
    }
}

function saveToLocalStorage(){
    const comment = document.getElementById("comment").value;

    if (!latitude || !longitude){
        alert("Сначала нужно определить местоположение!");
        return;
    }

    const locationData = {
        comment: comment,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date().toISOString()
    };

    const storageKey = `location_${new Date().getTime()}`;
    localStorage.setItem(storageKey, JSON.stringify(locationData));
    displayLocalStorage();
}

function displayLocalStorage(){
    const savedLocations = document.getElementById("savedLocations");
    savedLocations.innerHTML = "";
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith("location_")){
            const locationData = JSON.parse(localStorage.getItem(key));
            const div = document.createElement("div");
            div.innerHTML = `
                <strong>Комментарий:</strong> ${locationData.comment}<br>
                <strong>Широта:</strong> ${locationData.latitude}<br>
                <strong>Долгота:</strong> ${locationData.longitude}<br>
                <strong>Время:</strong> ${locationData.timestamp}<br>
            `;
            savedLocations.appendChild(div);
        }
    });
}

function saveToIndexedDB(){
    const comment = document.getElementById("comment").value;
    if (!latitude || !longitude){
        alert("Сначала нужно определить местоположение!");
        return;
    }
    const transaction = db.transaction(["locations"], "readwrite");
    const objectStore = transaction.objectStore("locations");
    const locationData = {
        comment: comment,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date().toISOString()
    };
    objectStore.add(locationData);
    transaction.oncomplete = () => {
        console.log("Данные успешно сохранены в IndexedDB");
        displayIndexedDB();
    };
    transaction.onerror = () => {
        console.error("Ошибка при сохранении данных в IndexedDB");
    };
}

function displayIndexedDB(){
    const savedLocations = document.getElementById("savedLocations");
    savedLocations.innerHTML = "";
    const transaction = db.transaction(["locations"], "readonly");
    const objectStore = transaction.objectStore("locations");
    objectStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const locationData = cursor.value;
            const div = document.createElement("div");
            div.innerHTML = `
                <strong>Комментарий:</strong> ${locationData.comment}<br>
                <strong>Широта:</strong> ${locationData.latitude}<br>
                <strong>Долгота:</strong> ${locationData.longitude}<br>
                <strong>Время:</strong> ${locationData.timestamp}<br>
            `;
            savedLocations.appendChild(div);
            cursor.continue();
        }
    };
}
document.addEventListener('DOMContentLoaded', displayLocalStorage);
