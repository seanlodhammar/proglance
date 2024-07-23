'use client';
import styles from './Input.module.css';
import { useState, type FC, type HTMLAttributes, type HTMLProps } from 'react';
import { Eye, EyeSlash } from '../icons';

interface InputProps extends HTMLProps<HTMLInputElement> {
    error?: boolean;
    inputType?: 'default' | 'reveal';
    wrapperClass?: string;
}

const Input : FC<InputProps> = ({ className, wrapperClass, error, inputType, ...props }) => { 
    if(inputType === 'reveal') {
        const [revealed, setRevealed] = useState<boolean>(false);
        const handleReveal = () => setRevealed((prevState) => !prevState);
        return (
            <div className={`${styles['input-wrapper']} ${wrapperClass ? wrapperClass : ''}`}>
                <Input { ...props } className={`${styles['input']} ${styles['reveal']} ${className ? className : ''}`}  type={revealed ? 'text' : 'password'}  />
                <button className={styles['input-reveal']} onClick={handleReveal} type='button'>{ !revealed ? <EyeSlash className={styles['eye-icon']} /> : <Eye className={styles['eye-icon']} /> }</button>
            </div>
        )
    }
    return (
        <input className={`${styles['input']} ${error ? styles['error'] : ''} ${className ? className : ''}`} { ...props } />
    )
}
export default Input;
