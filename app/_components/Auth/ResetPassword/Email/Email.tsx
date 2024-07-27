'use client';
import { type ChangeEvent, type FormEvent, useState, useEffect } from 'react';
import styles from './Email.module.css';
import Input from '@/app/_components/UI/Input';
import PreForm from '../../../UI/PreForm';
import { base } from '@/util/fetch';
import { email as emailValidation } from '@/util/validation';
import { ZodError } from 'zod';
import { AxiosError } from 'axios';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; cause: string; email?: string }>({ type: 'success', cause: 'Placeholder' });
    const [retry, setRetry] = useState<number | null>(null);
    const [sent, setSent] = useState<boolean>(false);
    const [intervalId, setIntervalId] = useState<string | null>(null);
    const [tries, setTries] = useState<number>(3);

    const retryDeincrement = () => {
        return setInterval(() => {
            setRetry((prevState) => {
                if(prevState === null) return prevState;
                const deincrement = prevState - 1000;
                if(deincrement === 0) return null;
                return deincrement;
            })
        }, 1000)
    }

    useEffect(() => {
        return () => {
            setIntervalId((prevState) => {
                if(typeof prevState === 'string') {
                   clearInterval(prevState); 
                }
                return null;
             })
        }
    }, [])

    useEffect(() => {
        if(typeof retry === 'number' && intervalId === null) {
            const deincrement = retryDeincrement();
            setIntervalId(deincrement as any);
        }
        if(typeof retry !== 'number' && intervalId) {
            setIntervalId(null);
            clearInterval(intervalId);
        }
        return () => {
            if(intervalId !== null && retry === null){
                clearInterval(intervalId);
                setIntervalId(null);
            }
        }
    }, [retry, intervalId]);

    const handleFormSubmission = async(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if(tries === 0) {
                setMessage({ type: 'error', cause: 'Try again later'});
                return;
            }
            const parsedEmail = emailValidation.parse(email); 
            const res = await base.post('/auth/reset-password', { email: parsedEmail })
            if(res.status !== 201) throw new Error('Something went wrong'); 
            if(res.data.tries) {
                setTries(res.data.tries);
                if(res.data.tries > 0) {
                    setSent(true);
                } else {
                    setSent(false);
                }          
            }
            setRetry(res.data.retryIn);
            setMessage({ type: 'success', cause: 'Email sent', email: res.data.email });
            return;
        } catch (err) {
            if(err instanceof ZodError) {
                return setMessage({ type: 'error', cause: err.errors[0].message });
            }
            if(err instanceof AxiosError) {
                if(err.response && err.response.data.msg) {
                    if(err.response.status === 403 && typeof err.response.data.retryIn === 'number') {
                        setRetry(err.response.data.retryIn);
                        return setMessage({ type: 'error', cause: err.response.data.msg });
                    }
                    return setMessage({ type: 'error', cause: err.response.data.msg });
                }
            }
            setEmail('');
            return setMessage({ type: 'error', cause: 'Something went wrong' });
        }
    }

    const emailHandler = (e: ChangeEvent<HTMLInputElement>) => {
        if(message.cause !== 'Placeholder') setMessage({ type: 'success', cause: 'Placeholder' });
        setEmail(e.target.value);
    }

    return (
        <PreForm title='Reset Password'> 
            <form className={styles['reset-form']} onSubmit={handleFormSubmission}>
                <input autoComplete="false" role='presentation' name="hidden" type="text" style={{ display: 'none' }} />
                <label htmlFor='email' className={styles['label']} id="input">Email</label> 
                <Input placeholder='email@example.com' id='email' className={styles['input']} value={email} onChange={emailHandler} />
                { sent ? <button type='submit' className={styles['retry-btn']} disabled={typeof retry === 'number' ? true : false}>
                    { typeof retry === 'number' ? `Retry in ${retry.toString().length === 5 ? retry.toString().slice(0, 2) : retry.toString().slice(0, 1)} seconds (${tries} tries remaining)` : `Retry now (${tries} tries remaining)` }
                </button> : null }
                <label htmlFor='email' className={`${styles['msg']} ${message.cause !== 'Placeholder' ? styles['reveal'] : styles['hide']} ${message.type === 'error' ? styles['error'] : styles['success']}`}>
                    {message.cause === 'Email sent' && message.type === 'success' && message.email ? `Email sent! Check your inbox at ${message.email}` : ''}
                    {message.cause === 'Placeholder' ? 'Placeholder' : ''}
                    {message.cause !== 'Placeholder' && message.type === 'error' ? message.cause : ''}
                </label>
                <button type='submit' className={styles['submit-btn']}>Submit</button>
            </form>
        </PreForm>
   )
}

export default ResetPassword;