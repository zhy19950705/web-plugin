import { IpcRenderer } from 'electron';

interface LoginParams {
    browser?: string;
    url?: string;
    loginId: string;
    password: string;
    domain: string;
}

declare global {
    interface Window {
        ipcRenderer: Pick<IpcRenderer, 'invoke'>;
        notification: {
            show(title: string, body: string): void;
        };
    }
}

export async function login (params: LoginParams) {
    try {
        await window.ipcRenderer.invoke('handle-login', params);
    } catch (error) {
        console.error('Login failed:', error);
        window.notification.show('登录失败', error instanceof Error ? error.message : '未知错误');
        throw error;
    }
}

export default login;