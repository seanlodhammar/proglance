'use client';
import { type ChangeEvent, type FC, type FormEvent, useState } from 'react';
import styles from './AuthForm.module.css';
import Link from 'next/link';
import { Google, Github, Eye, EyeSlash, Spinner } from '@/app/_components/UI/icons';
import { base } from '@/util/fetch';
import { constructErrorObj, user } from '@/util/validation';
import { ZodError } from 'zod';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import PreForm from '../../UI/PreForm';
import { Input, Label } from '@/app/_components/UI'; 

const AuthForm : FC<{ type: 'signup' | 'login' }> = ({ type }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [revealed, setRevealed] = useState(false);
    const [errors, setErrors] = useState<{ [error: string]: string } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    
    const handleFormSubmission = async(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);;
        try {
            const parse = user.parse({ email, password });
            try {
                const res = await base.post(`/auth/${type}`, { email: parse.email, password: parse.password });
                if(res.status >= 300 || res.status < 200) {
                    console.log(res.data.msg);
                    return;
                }
                router.replace('/');
            } catch (err) {
                if(err instanceof AxiosError) {
                    if(err.response && err.response.data.msg) {
                        return setErrors({ password: err.response.data.msg });
                    }
                    if(err.response && err.response.status >= 400 && err.response.data.errors) {
                        return setErrors(err.response.data.errors);
                    }
                }
            }
        } catch (err) {
            if(err instanceof ZodError) {
                const error = constructErrorObj(err);
                setErrors(error);
            }
        } finally {
            setLoading(false);
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
        <PreForm type='auth' title={type === 'login' ? 'Login' : 'Signup'} >
            <Label className={styles['other-opt']}>
                { type === 'signup' ? 'Already have an account?' : ''} 
                { type === 'login' ? 'Don\'t have an account?' : ''}
                &nbsp;
                <Link className={styles['other-opt-link']} href={type === 'signup' ? '/auth/login' : '/auth/signup'}>
                    { type === 'signup' ? 'Login here' : '' } 
                    { type === 'login' ? 'Signup here' : '' }
                </Link> 
            </Label>
            <form onSubmit={handleFormSubmission}>
                <input autoComplete="false" role='presentation' name="hidden" type="text" style={{ display: 'none' }} />
                <div className={styles['input-group']}>
                    <label htmlFor='email'>Email</label>
                    <Input placeholder='name@example.com' className={styles['input']} id='email' type='text' error={errors && errors.email ? true : false} autoComplete='off' value={email} onChange={emailHandler} />
                    <label htmlFor='email' className={`${styles['error-msg']} ${!errors || !errors.email ? styles['hide-error'] : ''}`}>{errors && errors.email ? errors.email : 'Placeholder'}</label>
                </div>
                <div className={`${styles['input-group']}`}>
                    <div className={styles['password-labels']}>
                        <label htmlFor='password'>Password</label>
                        <label htmlFor='password' className={`${styles['forgotten-password']}`}>Forgot your password? <Link href='/auth/reset-password'>Reset it</Link></label>
                    </div>
                    <div className={styles['password-wrapper']}>
                        <Input className={`${styles['input']} ${styles['input-password']}`} error={errors && errors.password ? true : false} placeholder='abcdef123456' id='password' type={revealed ? 'text' : 'password'} autoComplete='off' value={password} onChange={passwordHandler} />
                        <button className={styles['password-reveal']} onClick={handleReveal} type='button'>{ !revealed ? <EyeSlash className={styles['eye-icon']} /> : <Eye className={styles['eye-icon']} /> }</button>
                    </div>
                    <label htmlFor='password' className={`${styles['error-msg']} ${!errors || !errors.password ? styles['hide-error'] : ''}`}>{errors && errors.password ? errors.password : 'Placeholder'}</label>
                </div>
                <button type='submit' className={styles['submit-btn']}>
                    Submit
                    { loading ? <Spinner className={`${styles['spinner']}`} fill='#fff' /> : null }
                </button>
                <div className={styles['alt-auth']}>
                    <Link href='/api/auth/google' className={styles['auth-link']}><Google className={styles['btn-icon']}/>Google</Link>
                    <Link href='/api/auth/github' className={styles['auth-link']}><Github className={styles['btn-icon']}/>Github</Link>
                </div>
            </form>
        </PreForm>
    )
}

export default AuthForm;