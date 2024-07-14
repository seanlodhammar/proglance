'use client';
import { type ChangeEvent, type FC, type FormEvent, useState } from 'react';
import styles from './AuthForm.module.css';
import Link from 'next/link';
import { RectStack, Google, Github } from '@/app/_components/UI/icons';
import { base, getCookie } from '@/util/fetch';

const AuthForm : FC<{ type: 'signup' | 'login' }> = ({ type }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleFormSubmission = async(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if(type === 'signup') {
                const res = await base.post('/auth/signup', { email: email, password: password });
                console.log(res);
            }
        } catch (err) {
            console.log(err);
        }

    }

    const emailHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }

    const passwordHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    }
    
    return (
        <form className={styles['auth-form']} onSubmit={handleFormSubmission}>
            <RectStack className={styles['icon']} />
            <h2 className={styles['heading']}>{type === 'login' ? 'Login' : ''}{type === 'signup' ? 'Signup' : ''}</h2>
            <div className={styles['input-group']}>
                <label htmlFor='email'>Email</label>
                <input placeholder='name@example.com' id='email' value={email} onChange={emailHandler} />
            </div>
            <div className={styles['input-group']}>
                <label htmlFor='password'>Password</label>
                <input placeholder='abcdef123456' id='password' value={password} onChange={passwordHandler} />
            </div>
            <div className={styles['alt-auth']}>
                <Link href='/auth/google' className={styles['auth-link']}><Google className={styles['btn-icon']}/>Google</Link>
                <Link href='/auth/github' className={styles['auth-link']}><Github className={styles['btn-icon']}/>Github</Link>
            </div>
            <button type='submit' className={styles['submit-btn']}>Submit</button>
        </form>
    )
}

export default AuthForm;