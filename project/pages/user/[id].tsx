import { GetServerSideProps } from 'next';
import Layout from '../../src/components/Layout';
import UserProfile from '../../src/pages/UserProfile';

interface UserProfilePageProps {
  userId: string;
}

export default function UserProfilePage({ userId }: UserProfilePageProps) {
  return (
    <Layout>
      <UserProfile userId={userId} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  return {
    props: {
      userId: id,
    },
  };
};