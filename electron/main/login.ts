import { Notification } from 'electron'
import childProcess from 'child_process'

const base64Encode = (string) => Buffer.from(string).toString('base64')
export default async function login(config) {
    if (!config) return

    // 记录登录开始时间
    const startTime = new Date();
    const { domain, loginId, password, url, browser } = config

    const res = await fetch(`${url}/api/user/sign-in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            domain,
            loginId,
            password: base64Encode(password)
        })
    })
    .then(res => res.json())
    .catch(e => {
        new Notification({
            title: '登录失败',
            body: e.message || '未知错误'
        }).show();
        return;
    })
    
    // 检查登录响应
    if (res && !res.uIdToken) {
        // 发送通知
        new Notification({
            title: '登录失败',
            body: res
        }).show();
        return;
    }
    
    // 计算登录耗时
    const endTime = new Date();
    const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000; // 转换为秒
    
    // 使用vscode API显示成功消息
    new Notification({
        title: '登录成功',
        body: `登录成功！耗时: ${timeSpent.toFixed(2)}秒`
    }).show();
    const { uIdToken } = res

    try {
        const fullUrl = `${url}?loginToken=${uIdToken}`
        const command = 'open';
        const cliArguments = ['-a', browser, fullUrl];
        
        // 使用 execFile 替代 spawn，因为它更适合执行单个命令
        childProcess.execFile(command, cliArguments, (error) => {   
            if (error) {
                new Notification({
                    title: '打开浏览器失败',
                    body: `打开浏览器失败: ${error.message}`
                }).show();
            }
        });
    } catch (e) {
        new Notification({
            title: '打开浏览器失败',
            body: `打开浏览器失败: ${e.message}`
        }).show();
    }

}
