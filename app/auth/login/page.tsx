import styles from '../page.module.css';
import AuthForm from '@/app/_components/AuthForm/AuthForm';

const Page = () => {
    return (
        <main className={styles['auth-page']}>
            <AuthForm type='login' />
        </main>
    )
}

export default Page;