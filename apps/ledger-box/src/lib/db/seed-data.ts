import type { TransactionType } from './schema';

type SeedTransaction = {
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
};

type SeedWallet = {
  name: string;
  transactions: SeedTransaction[];
};

const SEED_WALLETS: SeedWallet[] = [
  {
    name: 'Cá nhân',
    transactions: [
      { type: 'income', amount: 28_000_000, description: 'Lương tháng', createdAt: '2026-07-01T09:00:00' },
      { type: 'expense', amount: 8_500_000, description: 'Tiền thuê nhà', createdAt: '2026-07-02T10:00:00' },
      { type: 'expense', amount: 850_000, description: 'Đi chợ tuần', createdAt: '2026-07-05T14:30:00' },
      { type: 'income', amount: 4_500_000, description: 'Freelance thiết kế', createdAt: '2026-07-08T16:00:00' },
      { type: 'expense', amount: 250_000, description: 'Netflix & các gói đăng ký', createdAt: '2026-07-10T08:00:00' },
      { type: 'expense', amount: 1_200_000, description: 'Phí gym', createdAt: '2026-07-11T07:30:00' },
      { type: 'expense', amount: 380_000, description: 'Cà phê & ăn trưa', createdAt: '2026-07-09T13:00:00' },
      { type: 'expense', amount: 199_000, description: 'Cước điện thoại', createdAt: '2026-07-03T11:00:00' },
      { type: 'income', amount: 28_000_000, description: 'Lương tháng', createdAt: '2026-06-01T09:00:00' },
      { type: 'expense', amount: 8_500_000, description: 'Tiền thuê nhà', createdAt: '2026-06-02T10:00:00' },
      {
        type: 'expense',
        amount: 2_800_000,
        description: 'Vé máy bay — chuyến đi hè',
        createdAt: '2026-06-14T16:00:00',
      },
      { type: 'expense', amount: 1_100_000, description: 'Điện & internet', createdAt: '2026-06-25T11:00:00' },
      { type: 'income', amount: 5_500_000, description: 'Bán laptop cũ', createdAt: '2026-06-18T15:00:00' },
      { type: 'expense', amount: 650_000, description: 'Ăn tối nhà hàng', createdAt: '2026-06-20T19:30:00' },
      { type: 'expense', amount: 190_000, description: 'Gói lưu trữ đám mây', createdAt: '2026-06-07T08:00:00' },
      { type: 'income', amount: 28_000_000, description: 'Lương tháng', createdAt: '2026-05-01T09:00:00' },
      { type: 'expense', amount: 8_500_000, description: 'Tiền thuê nhà', createdAt: '2026-05-02T10:00:00' },
      { type: 'expense', amount: 2_200_000, description: 'Giày chạy bộ mới', createdAt: '2026-05-10T14:00:00' },
      { type: 'expense', amount: 720_000, description: 'Đi chợ tuần', createdAt: '2026-05-17T12:00:00' },
      { type: 'income', amount: 3_500_000, description: 'Hoàn thuế', createdAt: '2026-05-22T10:00:00' },
    ],
  },
  {
    name: 'Tiết kiệm',
    transactions: [
      {
        type: 'income',
        amount: 5_000_000,
        description: 'Chuyển tiết kiệm hàng tháng',
        createdAt: '2026-07-01T12:00:00',
      },
      {
        type: 'income',
        amount: 5_000_000,
        description: 'Chuyển tiết kiệm hàng tháng',
        createdAt: '2026-06-01T12:00:00',
      },
      {
        type: 'income',
        amount: 5_000_000,
        description: 'Chuyển tiết kiệm hàng tháng',
        createdAt: '2026-05-01T12:00:00',
      },
      {
        type: 'income',
        amount: 5_000_000,
        description: 'Chuyển tiết kiệm hàng tháng',
        createdAt: '2026-04-01T12:00:00',
      },
      {
        type: 'income',
        amount: 5_000_000,
        description: 'Chuyển tiết kiệm hàng tháng',
        createdAt: '2026-03-01T12:00:00',
      },
      { type: 'expense', amount: 12_000_000, description: 'Sửa xe khẩn cấp', createdAt: '2026-05-18T09:00:00' },
      { type: 'income', amount: 15_000_000, description: 'Thưởng cuối năm', createdAt: '2026-03-15T10:00:00' },
      { type: 'expense', amount: 28_000_000, description: 'Nâng cấp laptop', createdAt: '2026-04-22T14:00:00' },
      { type: 'income', amount: 4_500_000, description: 'Bán đồ máy ảnh', createdAt: '2026-04-10T11:00:00' },
      {
        type: 'income',
        amount: 5_000_000,
        description: 'Chuyển tiết kiệm hàng tháng',
        createdAt: '2026-02-01T12:00:00',
      },
      { type: 'expense', amount: 6_500_000, description: 'Phí bảo hiểm năm', createdAt: '2026-02-14T09:00:00' },
      { type: 'income', amount: 8_000_000, description: 'Thưởng freelance', createdAt: '2026-06-28T16:00:00' },
      { type: 'expense', amount: 3_200_000, description: 'Đồ trang trí nhà', createdAt: '2026-05-30T15:00:00' },
      {
        type: 'income',
        amount: 5_000_000,
        description: 'Chuyển tiết kiệm hàng tháng',
        createdAt: '2026-01-01T12:00:00',
      },
      { type: 'expense', amount: 1_500_000, description: 'Vé concert', createdAt: '2026-06-10T18:00:00' },
      { type: 'income', amount: 2_000_000, description: 'Quà từ gia đình', createdAt: '2026-03-28T10:00:00' },
    ],
  },
  {
    name: 'Kinh doanh',
    transactions: [
      {
        type: 'income',
        amount: 65_000_000,
        description: 'Thanh toán khách hàng — Công ty Meridian',
        createdAt: '2026-07-03T10:00:00',
      },
      { type: 'expense', amount: 3_500_000, description: 'Phần mềm & license SaaS', createdAt: '2026-07-05T09:00:00' },
      { type: 'expense', amount: 18_000_000, description: 'Thiết bị văn phòng', createdAt: '2026-07-07T14:00:00' },
      { type: 'income', amount: 12_000_000, description: 'Phí tư vấn hàng tháng', createdAt: '2026-07-09T11:00:00' },
      { type: 'expense', amount: 890_000, description: 'Phần mềm kế toán', createdAt: '2026-06-30T09:00:00' },
      {
        type: 'income',
        amount: 58_000_000,
        description: 'Thanh toán khách hàng — Orion Labs',
        createdAt: '2026-06-05T10:00:00',
      },
      {
        type: 'expense',
        amount: 15_000_000,
        description: 'Hóa đơn contractor — thiết kế',
        createdAt: '2026-06-12T14:00:00',
      },
      { type: 'expense', amount: 8_500_000, description: 'Công tác & khách sạn', createdAt: '2026-06-18T08:00:00' },
      { type: 'income', amount: 12_000_000, description: 'Phí tư vấn hàng tháng', createdAt: '2026-06-09T11:00:00' },
      { type: 'expense', amount: 650_000, description: 'Gia hạn domain & hosting', createdAt: '2026-06-01T10:00:00' },
      {
        type: 'income',
        amount: 32_000_000,
        description: 'Milestone dự án — Apex Inc.',
        createdAt: '2026-05-20T15:00:00',
      },
      { type: 'expense', amount: 12_000_000, description: 'Marketing & quảng cáo', createdAt: '2026-05-25T09:00:00' },
      { type: 'income', amount: 12_000_000, description: 'Phí tư vấn hàng tháng', createdAt: '2026-05-09T11:00:00' },
      {
        type: 'expense',
        amount: 1_990_000,
        description: 'Gói đăng ký chuyên nghiệp',
        createdAt: '2026-05-01T08:00:00',
      },
      { type: 'expense', amount: 2_500_000, description: 'Ăn trưa khách hàng', createdAt: '2026-07-02T13:00:00' },
      {
        type: 'income',
        amount: 72_000_000,
        description: 'Thanh toán khách hàng — Halcyon Group',
        createdAt: '2026-05-04T10:00:00',
      },
      { type: 'expense', amount: 1_200_000, description: 'Chuyển phát & logistics', createdAt: '2026-06-22T11:00:00' },
      {
        type: 'expense',
        amount: 3_500_000,
        description: 'Không gian coworking — tháng 6',
        createdAt: '2026-06-03T09:00:00',
      },
    ],
  },
];

export { SEED_WALLETS };
export type { SeedTransaction, SeedWallet };
