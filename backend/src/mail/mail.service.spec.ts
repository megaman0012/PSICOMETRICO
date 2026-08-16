import { Test, TestingModule } from '@nestjs/testing';
import { MailService, obtenerConfigMail } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('obtenerConfigMail', () => {
  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  it('should return null when SMTP_HOST is not set', () => {
    expect(obtenerConfigMail()).toBeNull();
  });

  it('should return config with defaults when SMTP_HOST is set', () => {
    process.env.SMTP_HOST = 'smtp.example.com';

    expect(obtenerConfigMail()).toEqual({
      host: 'smtp.example.com',
      port: 587,
      user: '',
      pass: '',
      from: 'no-reply@psicometrico.com',
    });
  });

  it('should return full config when all vars are set', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'from@example.com';

    expect(obtenerConfigMail()).toEqual({
      host: 'smtp.example.com',
      port: 465,
      user: 'user',
      pass: 'pass',
      from: 'from@example.com',
    });
  });
});

describe('MailService', () => {
  let service: MailService;
  const mockSendMail = jest.fn();

  beforeEach(async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'from@example.com';

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
    (service as any).transport = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  describe('enviarCorreo', () => {
    it('should return false when SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;
      (service as any).transport = null;

      await expect(service.enviarCorreo('a@b.com', 'S', '<p>h</p>')).resolves.toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should send the mail and return true', async () => {
      mockSendMail.mockResolvedValue({ messageId: '1' });

      await expect(service.enviarCorreo('a@b.com', 'S', '<p>h</p>')).resolves.toBe(true);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'user', pass: 'pass' },
      });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'from@example.com',
        to: 'a@b.com',
        subject: 'S',
        html: '<p>h</p>',
      });
    });

    it('should return false when sendMail fails', async () => {
      mockSendMail.mockRejectedValue(new Error('connection refused'));

      await expect(service.enviarCorreo('a@b.com', 'S', '<p>h</p>')).resolves.toBe(false);
    });
  });
});
