import styles from '../page.module.css';
import AuthForm from '@/app/_components/AuthForm/AuthForm';

const Page = () => {
    return (
        <main className={styles['auth-page']}>
            <AuthForm type='signup' />
        </main>
    )
}

export default Page;