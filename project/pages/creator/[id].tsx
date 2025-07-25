import { GetServerSideProps } from 'next';
import Layout from '../../src/components/Layout';
import CreatorProfile from '../../src/pages/CreatorProfile';

interface CreatorProfilePageProps {
  creatorId: string;
}

export default function CreatorProfilePage({ creatorId }: CreatorProfilePageProps) {
  return (
    <Layout>
      <CreatorProfile creatorId={creatorId} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  return {
    props: {
      creatorId: id,
    },
  };
};