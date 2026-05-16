export const handleChatDisconnect = (params: { isManualDisconnect: boolean; onDisconnect: () => void }) => {
    if (params.isManualDisconnect) {
        return;
    }

    params.onDisconnect();
};
