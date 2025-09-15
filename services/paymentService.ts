import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';

export default class PaymentService {
  static async recordTransaction(data: any) {
    await dbConnect();
    const tx = await Transaction.create(data);
    return tx;
  }
}
