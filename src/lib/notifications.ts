export async function sendNotification(title: string, body: string, silent = false) {
    if (typeof window !== "undefined" && window.electron) {
        // Electron Native Notification
        window.electron.showNotification(title, body, silent);
    } else if ("Notification" in window) {
        // Browser Web Notification
        if (Notification.permission === "granted") {
            new Notification(title, { body, silent });
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification(title, { body, silent });
            }
        }
    }
}
