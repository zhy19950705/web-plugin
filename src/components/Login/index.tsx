import React, { useState, useRef, useEffect } from 'react';
import { Button, Tree, Tag, Popconfirm, Modal, Form, Input, Select, message, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, ChromeOutlined, CompassOutlined, GlobalOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import './index.css';
import login from './login';

interface AccountEnv {
    env: string;
    key?: string;
    children: AccountData[];
}

interface AccountData {
    env: string;
    domain: string;
    loginId: string;
    password: string;
    url?: string;
    browser?: string;
    key?: string;
}

const Login: React.FC = () => {
    const [accounts, setAccounts] = useState<AccountEnv[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [createVisible, setCreateVisible] = useState(false);
    const [form] = Form.useForm();
    const formRef = useRef<FormInstance>(null);
    const [importVisible, setImportVisible] = useState(false);
    const [importText, setImportText] = useState('');
    const [accountInfo, setAccountInfo] = useState<any>(null);

    useEffect(() => {
        const loginAccounts = localStorage.getItem('loginAccounts');
        if (loginAccounts) {
            const parsedAccounts = JSON.parse(loginAccounts)
                .map((item: any) => ({
                    ...item,
                    key: item.env,
                    children: item.children.map((child: any) => ({ 
                        ...child, 
                        key: `${child.domain}-${child.loginId}-${child.env}` 
                    }))
                }));
            setAccounts(parsedAccounts);
            // 设置默认展开的key
            setExpandedKeys(parsedAccounts.map((item: any) => item.key));
        }
    }, []);

    const browsers = [
        { label: 'Chrome', value: 'Google Chrome', icon: <ChromeOutlined style={{ color: '#4285F4' }} /> },
        { label: 'Firefox', value: 'Firefox', icon: <GlobalOutlined style={{ color: '#FF7139' }} /> },
        { label: 'Arc', value: 'Arc', icon: <GlobalOutlined style={{ color: '#5B21B6' }} /> },
        { label: 'Edge', value: 'Edge', icon: <GlobalOutlined style={{ color: '#0078D7' }} /> },
        { label: 'Safari', value: 'Safari', icon: <CompassOutlined style={{ color: '#006CFF' }} /> },
    ];

    const addAccount = () => {
        setCreateVisible(true);
    };

    const onClose = () => {
        setCreateVisible(false);
        form.resetFields();
    };

    const onConfirm = async () => {
        try {
            const values = await form.validateFields();
            const formData = {...values, key: `${values.domain}-${values.loginId}-${values.env}`};

            if (accountInfo) {
                const newAccounts = accounts.map(item => {
                    if (item.env === accountInfo.env) {
                        const newChildren = item.children.map((child: AccountData) => 
                            child.domain === accountInfo.domain && 
                            child.loginId === accountInfo.loginId ? 
                            { ...formData, key: `${formData.domain}-${formData.loginId}-${formData.env}` } : child
                        );
                        return { ...item, children: newChildren };
                    }
                    return item;
                });
                setAccounts(newAccounts);
                localStorage.setItem('loginAccounts', JSON.stringify(newAccounts));
            } else {
                // 使用不可变方式更新accounts
                const newAccounts = [...accounts];
                const curEnvIndex = newAccounts.findIndex(item => item.env === formData.env);
                
                if (curEnvIndex !== -1) {
                    // 如果环境已存在，创建新的children数组
                    newAccounts[curEnvIndex] = {
                        ...newAccounts[curEnvIndex],
                        children: [...newAccounts[curEnvIndex].children, formData]
                    };
                } else {
                    // 如果环境不存在，添加新的环境和账户
                    newAccounts.push({
                        env: formData.env,
                        children: [formData]
                    });
                }
                setAccounts(newAccounts);
                
                // 使用更新后的accounts保存到localStorage
                localStorage.setItem('loginAccounts', JSON.stringify(newAccounts));
            }
            
            setCreateVisible(false);
            form.resetFields();
            setAccountInfo(null);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const editAccount = (record: AccountData) => {
        setAccountInfo(record);
        form.setFieldsValue(record);
        setCreateVisible(true);
    };

    const deleteAccount = (record: AccountData) => {
        const newAccounts = accounts.map(item => {
            if (item.env === record.env) {
                const newChildren = item.children.filter((child: AccountData) => 
                    child.domain !== record.domain || child.loginId !== record.loginId
                );
                return { ...item, children: newChildren };
            }
            return item;
        }).filter(item => item.children.length > 0);
        setAccounts(newAccounts);
        localStorage.setItem('loginAccounts', JSON.stringify(newAccounts));
    };

    const prodLogin = (record: AccountData, browser?: string) => {
        login({ ...record, browser: browser || 'Google Chrome' });
    };

    const importAccounts = () => {
        setImportVisible(true);
    };

    const exportAccounts = () => {
        const accountsData = JSON.stringify(accounts, null, 2);
        navigator.clipboard.writeText(accountsData)
            .then(() => {
                message.success('账户数据已成功复制到剪贴板');
            })
            .catch(err => {
                message.error('复制到剪贴板失败: ' + err);
            });
    };

    const onImportClose = () => {
        setImportVisible(false);
        setImportText('');
    };

    const onImportConfirm = () => {
        try {
            const importData = JSON.parse(importText);
            if (Array.isArray(importData)) {
                // 使用不可变方式更新
                const newAccounts = [...accounts];
                
                // 遍历导入的数据
                importData.forEach((importEnv: AccountEnv) => {
                    // 查找是否存在相同env的环境
                    const existingEnvIndex = newAccounts.findIndex(acc => acc.env === importEnv.env);
                    
                    if (existingEnvIndex === -1) {
                        // 如果环境不存在，直接添加
                        newAccounts.push({
                            ...importEnv,
                            key: importEnv.env,
                            children: importEnv.children.map((child: AccountData) => ({
                                ...child,
                                key: `${child.domain}-${child.loginId}-${child.env}`
                            }))
                        });
                    } else {
                        // 如果环境存在，遍历其children
                        const existingEnv = newAccounts[existingEnvIndex];
                        const newChildren = [...existingEnv.children];
                        
                        importEnv.children.forEach((importChild: AccountData) => {
                            // 检查是否存在相同的账号
                            const exists = newChildren.some(existingChild => 
                                existingChild.env === importChild.env && 
                                existingChild.domain === importChild.domain && 
                                existingChild.loginId === importChild.loginId
                            );
                            
                            // 如果不存在，则添加到对应环境的children中
                            if (!exists) {
                                newChildren.push({
                                    ...importChild,
                                    key: `${importChild.domain}-${importChild.loginId}-${importChild.env}`
                                });
                            }
                        });
                        
                        // 更新环境的children
                        newAccounts[existingEnvIndex] = {
                            ...existingEnv,
                            children: newChildren
                        };
                    }
                });
                
                setAccounts(newAccounts);
                localStorage.setItem('loginAccounts', JSON.stringify(newAccounts));
                setImportVisible(false);
                setImportText('');
                message.success('导入成功');
            } else {
                message.error('导入数据格式错误，请确保是正确的账号数据');
            }
        } catch (e) {
            message.error('导入数据解析失败，请确保是有效的JSON格式');
        }
    };

    const renderLoginDropdown = (record: AccountData) => {
        const items = browsers.map(browser => ({
            key: browser.value,
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {browser.icon}
                    <span>{browser.label}</span>
                </span>
            ),
            onClick: () => prodLogin(record, browser.value)
        }));

        return (
            <Dropdown menu={{ items }} placement="bottomRight">
                <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => prodLogin(record)}>
                    <ChromeOutlined /> 登录
                </Tag>
            </Dropdown>
        );
    };

    return (
        <div className="login">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-left">
                    <span>账号列表</span>
                    <Button type="primary" onClick={addAccount} size="small" style={{ marginLeft: 10 }}>
                        添加账号
                    </Button>
                </div>
                <div className="header-right">
                    <Button type="text" onClick={importAccounts} size="small" style={{ marginLeft: 10 }}>导入</Button>
                    <Button type="text" onClick={exportAccounts} size="small" style={{ marginLeft: 10 }}>导出</Button>
                </div>
            </div>

            <div className="content">
                <Tree
                    treeData={accounts}
                    expandedKeys={expandedKeys}
                    onExpand={(keys) => setExpandedKeys(keys as string[])}
                    height={650}
                    titleRender={(nodeData: any) => {
                        if (!nodeData.domain) {
                            return <span>{nodeData.env}</span>;
                        }
                        return (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr', gridGap: 12 }}>
                                <div>{nodeData.domain}</div>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nodeData.loginId}</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {renderLoginDropdown(nodeData)}
                                    <EditOutlined style={{ cursor: 'pointer' }} onClick={() => editAccount(nodeData)} />
                                    <Popconfirm
                                        title="确定要删除这个账号吗？"
                                        onConfirm={() => deleteAccount(nodeData)}
                                        okText="确定"
                                        cancelText="取消"
                                    >
                                        <DeleteOutlined style={{ cursor: 'pointer' }} />
                                    </Popconfirm>
                                </div>
                            </div>
                        );
                    }}
                />

                <Modal
                    open={createVisible}
                    title="添加账号"
                    onCancel={onClose}
                    onOk={onConfirm}
                    width="80%"
                    centered
                >
                    <Form
                        form={form}
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                    >
                        <Form.Item
                            label="环境"
                            name="env"
                            rules={[{ required: true, message: '请输入环境' }]}
                        >
                            <Input placeholder="demo(区分用)" />
                        </Form.Item>

                        <Form.Item
                            label="域名"
                            name="domain"
                            rules={[{ required: true, message: '请输入域名' }]}
                        >
                            <Input placeholder="guanbi" />
                        </Form.Item>

                        <Form.Item
                            label="账号"
                            name="loginId"
                            rules={[{ required: true, message: '请输入账号' }]}
                        >
                            <Input placeholder="admin" />
                        </Form.Item>

                        <Form.Item
                            label="密码"
                            name="password"
                            rules={[{ required: true, message: '请输入密码' }]}
                        >
                            <Input placeholder="123456" />
                        </Form.Item>

                        <Form.Item
                            label="登录地址"
                            name="url"
                            rules={[{ required: true, message: '请输入登录地址' }]}
                        >
                            <Input placeholder="（不要带/后缀）https://demo.guandata.com" />
                        </Form.Item>

                        <Form.Item
                            label="browser"
                            name="browser"
                        >
                            <Select placeholder="请选择浏览器" options={browsers} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
            <Modal
                open={importVisible}
                title="导入账号"
                onCancel={onImportClose}
                onOk={onImportConfirm}
                width="80%"
                centered
            >
                <Input.TextArea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={10}
                    placeholder="请粘贴账号数据"
                />
            </Modal>
        </div>
    );
};

export default Login;