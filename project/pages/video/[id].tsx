import { GetServerSideProps } from 'next';
import Layout from '../../src/components/Layout';
import VideoPage from '../../src/pages/VideoPage';

interface VideoPageProps {
  videoId: string;
}

export default function VideoPageRoute({ videoId }: VideoPageProps) {
  return (
    <Layout>
      <VideoPage videoId={videoId} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  return {
    props: {
      videoId: id,
    },
  };
};