-- Create debt table to store the main debt information
CREATE TABLE public.debt (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table to track all payments made
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID NOT NULL REFERENCES public.debt(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a personal app)
-- You can add authentication later if needed
CREATE POLICY "Allow all operations on debt" 
ON public.debt 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on payments" 
ON public.payments 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_debt_updated_at
BEFORE UPDATE ON public.debt
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_payments_debt_id ON public.payments(debt_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date DESC);