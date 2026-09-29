let listeners = [];

export function isOnline() {
    return navigator.onLine;
}

export function onConnectivityChange(callback) {
    listeners.push(callback);

    return () => {
        listeners = listeners.filter((fn) => fn !== callback);
    };
}

window.addEventListener("online", () => {
    listeners.forEach((fn) => fn(true));
});

window.addEventListener("offline", () => {
    listeners.forEach((fn) => fn(false));
});
