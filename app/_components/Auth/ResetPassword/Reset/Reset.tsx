'use client';
import styles from './Reset.module.css';
import { PreForm, Input, Label } from "@/app/_components/UI";
import { type ChangeEvent, type FormEvent, useState  } from 'react';
import { base } from "@/util/fetch";
import { ZodError } from 'zod';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

const Reset = ({ id }: { id: string }) => {
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [errors, setErrors] = useState<{ password: string; confirmation: string }>({ password: 'Placeholder', confirmation: 'Placeholder' });
    const router = useRouter();

    const formSubmissionHandler = async(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if(password.length < 12) throw new Error('Password must be greater than 12 characters')
            if(password !== confirmation) throw new Error('Passwords don\'t match')
            const res = await base.post(`/auth/reset-password/${id}`, { password: password, confirmation: confirmation });
            if(res.status !== 200) throw new Error('Something went wrong');
            return router.replace('/auth/login');
        } catch (err) {
            console.log(err)
            if(err instanceof ZodError) {
                return setErrors((prevState) => ({ ...prevState, confirmation: 'Something went wrong' }));
            }
            if(err instanceof AxiosError) {
                const resp = err.response;
                if(resp && resp.data.msg) {
                    return setErrors((prevState) => ({ ...prevState, confirmation: resp.data.msg }))
                }
            }
        }
    }

    const passwordHandler = (e: ChangeEvent<HTMLInputElement>) => {
        if(errors.password !== 'Placeholder') setErrors((prevState) => ({ ...prevState, password: 'Placeholder' }));
        setPassword(e.target.value);
    }

    const confirmationHandler = (e: ChangeEvent<HTMLInputElement>) => {
        if(errors.confirmation !== 'Placeholder') setErrors((prevState) => ({ ...prevState, confirmation: 'Placeholder' }));
        setConfirmation(e.target.value);
    }

    return (
        <PreForm title='Reset Password'>
            <form onSubmit={formSubmissionHandler}>
                <input autoComplete="false" role='presentation' name="hidden" type="text" style={{ display: 'none' }} />
                <div className={styles['input-wrap']}>
                    <Label htmlFor='password' >New Password</Label>
                    <Input inputType='reveal' wrapperClass={styles['input']} placeholder='Type password here'  id='password' value={password} onChange={passwordHandler} />
                    <Label htmlFor='password' className={`${errors.password !== 'Placeholder' ? styles['show'] : styles['hide']}`}>{ errors.password }</Label> 
                </div>
                <div className={styles['input-wrap']}>
                    <Label htmlFor='confirmation' >Retype New Password</Label>
                    <Input inputType='reveal' wrapperClass={styles['input']} placeholder='Retype your password' id='confirmation' value={confirmation} onChange={confirmationHandler} />
                    <Label htmlFor='password' className={errors.confirmation !== 'Placeholder' ? styles['show'] : styles['hide']}>{errors.confirmation}</Label>
                </div>
                <button className={styles['submit-btn']} type='submit'>Submit</button>
            </form> 
        </PreForm>
    )
}

export default Reset;