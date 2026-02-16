import { Card, Col, Row, Statistic, Typography } from 'antd';
import { getAuthEmail } from '../utils/auth';

const { Title, Paragraph } = Typography;

// Dashboard placeholder with a personalized welcome message.
const Dashboard = (): JSX.Element => {
  const email = getAuthEmail();

  return (
    <div>
      <Title level={2} className="!mb-2 !text-brand-black">
        Dashboard
      </Title>
      <Paragraph className="!mb-6 !text-brand-black/70">Welcome, {email}. You are logged in successfully.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Active Users" value={128} valueStyle={{ color: '#00bfc3' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Pending Tasks" value={23} valueStyle={{ color: '#ff2273' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Announcements" value={5} valueStyle={{ color: '#ffd33b' }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
