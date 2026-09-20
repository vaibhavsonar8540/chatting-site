'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ServerOff } from 'lucide-react';

export default function AuthForm() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const { login, register, serverStatus } = useAuth();

    const switchMode = (newMode) => {
        if (newMode === mode) return;
        setMode(newMode);
        setErrorMsg('');
        setSuccessMsg('');
        // Keep inputs or clear password for clean state
        setErrorMsg('');
    };

    const validateForm = () => {
        if (mode === 'register') {
            const trimmedUsername = username.trim();
            if (!trimmedUsername) {
                setErrorMsg('Username is required');
                return false;
            }
            if (trimmedUsername.length < 3) {
                setErrorMsg('Username must be at least 3 characters long');
                return false;
            }
        }

        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setErrorMsg(mode === 'login' ? 'Email address or username is required' : 'Email address is required');
            return false;
        }

        if (mode === 'register') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                setErrorMsg('Please enter a valid email address');
                return false;
            }
        }

        if (!password) {
            setErrorMsg('Password is required');
            return false;
        }

        if (mode === 'register' && password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            let res;
            if (mode === 'login') {
                res = await login(email.trim(), password);
            } else {
                res = await register(username.trim(), email.trim(), password);
            }

            if (res.success) {
                setSuccessMsg(res.message || (mode === 'login' ? 'Logged in successfully!' : 'Account created successfully!'));
            } else {
                setErrorMsg(res.message || 'An error occurred during authentication');
            }
        } catch (err) {
            setErrorMsg(err?.message || 'Failed to connect to server');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-header">
                <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                <p>{mode === 'login' ? 'Sign in to access your secure chat dashboard' : 'Enter your details below to register'}</p>
            </div>

            <div className="glass-card auth-card">
                <div className="tab-group" role="tablist" aria-label="Authentication modes">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'login'}
                        className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'register'}
                        className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        Register
                    </button>
                </div>

                {serverStatus === 'offline' && (
                    <div 
                        className="alert-banner error" 
                        role="alert"
                        style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#b45309' }}
                    >
                        <ServerOff size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong>Backend Server Offline</strong>
                            <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                                Ensure backend server is running at <code>https://chatting-site-4iv8.onrender.com</code>.
                            </div>
                        </div>
                    </div>
                )}

                {errorMsg && (
                    <div className="alert-banner error" role="alert">
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="alert-banner success" role="alert">
                        <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>{successMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {mode === 'register' && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="username">
                                Username
                            </label>
                            <div className="input-container">
                                <div className="input-icon">
                                    <User size={18} />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    className="form-input"
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (errorMsg) setErrorMsg('');
                                    }}
                                    disabled={isSubmitting}
                                    required={mode === 'register'}
                                    autoComplete="username"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            {mode === 'login' ? 'Email or Username' : 'Email Address'}
                        </label>
                        <div className="input-container">
                            <div className="input-icon">
                                <Mail size={18} />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type={mode === 'register' ? 'email' : 'text'}
                                className="form-input"
                                placeholder={mode === 'login' ? 'user@example.com or username' : 'user@example.com'}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errorMsg) setErrorMsg('');
                                }}
                                disabled={isSubmitting}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Password
                        </label>
                        <div className="input-container">
                            <div className="input-icon">
                                <Lock size={18} />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input has-right-icon"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errorMsg) setErrorMsg('');
                                }}
                                disabled={isSubmitting}
                                required
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                            <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isSubmitting}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {mode === 'register' && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.35rem' }}>
                                Password must be at least 6 characters long
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                        style={{ marginTop: '1.5rem' }}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner"></span>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>{mode === 'login' ? 'Sign In to Account' : 'Create Account'}</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

