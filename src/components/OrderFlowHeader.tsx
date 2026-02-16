import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import Logo from "../images/logo.png";

const { Title, Text } = Typography;

interface OrderFlowHeaderProps {
  step: number;
  totalSteps?: number;
  backTo?: string;
  backLabel?: string;
}

// Shared header for all public order steps to keep look and flow consistent.
const OrderFlowHeader = ({
  step,
  totalSteps = 4,
  backTo,
  backLabel = "Kembali",
}: OrderFlowHeaderProps): JSX.Element => {
  const navigate = useNavigate();

  return (
    <header className="mb-6 rounded-2xl border border-brand-black/10 bg-white/85 p-4 backdrop-blur md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="Equinox Studio" className="h-14 w-auto" />
          <div>
            <Title level={4} className="!mb-0 !text-brand-black">
              Equinox Studio
            </Title>
            <Text className="!text-brand-black/60">Booking Online</Text>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {backTo ? (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(backTo)}
              className="!border-brand-black/20 !text-brand-black hover:!border-brand-pink hover:!text-brand-pink"
            >
              {backLabel}
            </Button>
          ) : null}
          <Tag
            color="#ff2273"
            className="!m-0 !px-3 !py-1 !text-sm !font-semibold"
          >
            Step {step} of {totalSteps}
          </Tag>
        </div>
      </div>
    </header>
  );
};

export default OrderFlowHeader;
