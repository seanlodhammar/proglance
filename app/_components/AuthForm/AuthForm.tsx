'use client';
import { type ChangeEvent, type FC, type FormEvent, useState } from 'react';
import styles from './AuthForm.module.css';
import Link from 'next/link';
import { RectStack, Google, Github, Eye, EyeSlash } from '@/app/_components/UI/icons';
import { base } from '@/util/fetch';
import { constructErrorObj, user } from '@/util/validation';
import { ZodError } from 'zod';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

const AuthForm : FC<{ type: 'signup' | 'login' }> = ({ type }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [revealed, setRevealed] = useState(false);
    const [errors, setErrors] = useState<{ [error: string]: string } | null>(null);
    const router = useRouter();
    
    const handleFormSubmission = async(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const parse = user.parse({ email, password });
            try {
                const res = await base.post(`/auth/${type}`, { email: parse.email, password: parse.password });
                if(res.status !== 200) {
                    console.log(res.data.msg);
                    return;
                }
                router.replace('/');
            } catch (err) {
                if(err instanceof AxiosError) {
                    if(err.response && err.response.data.msg) {
                        return setErrors({ password: err.response.data.msg });
                    }
                    if(err.response && err.response.status === 401 && err.response.data.errors) {
                        return setErrors(err.response.data.errors);
                    }
                }
            }
        
        } catch (err) {
            if(err instanceof ZodError) {
                const error = constructErrorObj(err);
                setErrors(error);
            }
        }

    }

    const emailHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if(errors && errors.email) {
            setErrors((prevState) => {
                if(prevState) {
                    delete prevState['email'];
                }
                return prevState;
            })
        }
    }

    const passwordHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if(errors && errors.password) {
            setErrors((prevState) => {
                if(prevState) {
                    delete prevState['password'];
                }
                return prevState;
            })
        }
    }

    const handleReveal = () => {
        setRevealed((prevState) => !prevState);
    }
    
    return (
        <form className={styles['auth-form']} onSubmit={handleFormSubmission}>
            <RectStack className={styles['icon']} />
            <h2 className={styles['heading']}>{type === 'login' ? 'Login' : ''}{type === 'signup' ? 'Signup' : ''}</h2>
            <div className={styles['input-group']}>
                <label htmlFor='email'>Email</label>
                <input placeholder='name@example.com' className={`${errors && errors.email ? styles['input-error'] : '' }`} id='email' type='text' autoComplete='off' value={email} onChange={emailHandler} />
                <label htmlFor='email' className={`${styles['error-msg']} ${!errors || !errors.email ? styles['hide-error'] : ''}`}>{errors && errors.email ? errors.email : 'Placeholder'}</label>
            </div>
            <div className={`${styles['input-group']}`}>
                <label htmlFor='password'>Password</label>
                <div className={styles['password-wrapper']}>
                    <input className={`${styles['input-password']} ${errors && errors.password ? styles['input-error'] : ''}`} placeholder='abcdef123456' id='password' type={revealed ? 'text' : 'password'} autoComplete='off' value={password} onChange={passwordHandler} />
                    <button className={styles['password-reveal']} onClick={handleReveal} type='button'>{ !revealed ? <EyeSlash className={styles['eye-icon']} /> : <Eye className={styles['eye-icon']} /> }</button>
                </div>
                <label htmlFor='password' className={`${styles['error-msg']} ${!errors || !errors.password ? styles['hide-error'] : ''}`}>{errors && errors.password ? errors.password : 'Placeholder'}</label>
            </div>
            <div className={styles['alt-auth']}>
                <Link href='/api/auth/google' className={styles['auth-link']}><Google className={styles['btn-icon']}/>Google</Link>
                <Link href='/api/auth/github' className={styles['auth-link']}><Github className={styles['btn-icon']}/>Github</Link>
            </div>
            <button type='submit' className={styles['submit-btn']}>Submit</button>
        </form>
    )
}

export default AuthForm;