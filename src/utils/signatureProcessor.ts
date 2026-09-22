/**
 * Bộ xử lý chữ ký ảnh chuyên nghiệp dành cho Giáo viên chủ nhiệm:
 * - Tự động xóa nền giấy trắng, bóng mờ khi chụp ảnh chữ ký bằng điện thoại
 * - Tách nét chữ ký trong suốt (transparent PNG)
 * - Khử viền trắng (anti-halo)
 * - Tùy chỉnh màu mực: Giữ nguyên bản / Mực xanh sư phạm / Mực đen hành chính
 * - Tự động cắt tỉa viền thừa (Auto-crop bounding box)
 */

export interface SignatureProcessOptions {
  threshold?: number; // Ngưỡng độ sáng giấy trắng (160 - 245, mặc định: 215)
  smoothness?: number; // Độ chuyển tiếp mềm nét chữ (15 - 50, mặc định: 30)
  enhanceContrast?: boolean; // Tăng độ đậm nét mực bút bi/bút mực
  inkColor?: 'original' | 'blue' | 'black'; // Màu mực
  autoCrop?: boolean; // Tự động cắt khoảng trắng thừa xung quanh
}

/**
 * Xóa nền ảnh chữ ký và xuất thành DataURL PNG trong suốt
 */
export function processSignatureImage(
  dataUrl: string,
  options: SignatureProcessOptions = {}
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const threshold = options.threshold ?? 215;
        const smoothness = options.smoothness ?? 30;
        const enhanceContrast = options.enhanceContrast ?? true;
        const inkColor = options.inkColor ?? 'original';
        const autoCrop = options.autoCrop ?? true;

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Giới hạn kích thước tối đa 1200px để xử lý nhanh và mượt mà
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Tọa độ hộp bao bounding box cho tính năng auto-crop
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let hasInkPixels = false;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const currentA = data[i + 3];

          if (currentA === 0) continue;

          // Tính độ sáng cảm nhận (Luminance) theo chuẩn ITU-R BT.601
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Tính độ trong suốt Alpha dựa trên ngưỡng tách nền
          let alpha = 0;
          if (lum < threshold) {
            if (lum <= threshold - smoothness) {
              alpha = 255;
            } else {
              alpha = Math.round(((threshold - lum) / smoothness) * 255);
            }
          }

          if (alpha > 15) {
            const pixelIndex = i / 4;
            const px = pixelIndex % width;
            const py = Math.floor(pixelIndex / width);
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
            hasInkPixels = true;
          }

          if (alpha === 0) {
            data[i + 3] = 0;
          } else {
            data[i + 3] = alpha;

            if (inkColor === 'blue') {
              // Mực xanh sư phạm chuẩn (Xanh mực Cửu Long / Thiên Long)
              const factor = (255 - lum) / 255;
              data[i] = Math.round(18 + (1 - factor) * 25);     // Đỏ nhẹ 18 - 43
              data[i + 1] = Math.round(52 + (1 - factor) * 45); // Lục 52 - 97
              data[i + 2] = Math.round(155 + factor * 65);      // Lam đậm 155 - 220
            } else if (inkColor === 'black') {
              // Mực đen hành chính
              const factor = (255 - lum) / 255;
              const val = Math.round(25 * (1 - factor));
              data[i] = val;
              data[i + 1] = val;
              data[i + 2] = val;
            } else {
              // 'original': Giữ màu bút gốc nhưng tăng độ đậm nét mực và loại bỏ ám trắng
              if (enhanceContrast) {
                const strokeDarkness = Math.min(1, (255 - lum) / Math.max(1, 255 - (threshold - smoothness)));
                const darkenFactor = 0.75 + (1 - strokeDarkness) * 0.25;
                data[i] = Math.max(0, Math.round(r * darkenFactor));
                data[i + 1] = Math.max(0, Math.round(g * darkenFactor));
                data[i + 2] = Math.max(0, Math.round(b * darkenFactor));
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Cắt gọn khoảng trắng thừa xung quanh nếu phát hiện nét chữ
        if (autoCrop && hasInkPixels && maxX > minX && maxY > minY) {
          const padding = 12;
          const cropX = Math.max(0, minX - padding);
          const cropY = Math.max(0, minY - padding);
          const cropW = Math.min(width - cropX, maxX - minX + padding * 2);
          const cropH = Math.min(height - cropY, maxY - minY + padding * 2);

          if (cropW > 10 && cropH > 10) {
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = cropW;
            croppedCanvas.height = cropH;
            const croppedCtx = croppedCanvas.getContext('2d');
            if (croppedCtx) {
              croppedCtx.drawImage(
                canvas,
                cropX,
                cropY,
                cropW,
                cropH,
                0,
                0,
                cropW,
                cropH
              );
              resolve(croppedCanvas.toDataURL('image/png'));
              return;
            }
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Lỗi tách nền chữ ký:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Tạo chữ ký mẫu mực xanh sư phạm sẵn có để Giáo viên chủ nhiệm test nhanh 1 chạm
 */
export function createSampleTeacherSignature(teacherName: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Nền trong suốt
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ đường nét chữ ký phóng khoáng kiểu bút mực học đường
  ctx.strokeStyle = '#1E3A8A'; // Mực xanh đậm
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Nét uốn lượn chữ cái đầu
  ctx.moveTo(40, 95);
  ctx.bezierCurveTo(45, 30, 85, 20, 95, 55);
  ctx.bezierCurveTo(105, 90, 80, 110, 65, 95);
  ctx.bezierCurveTo(55, 80, 80, 60, 130, 50);

  // Thân chữ ký lượn sóng
  ctx.bezierCurveTo(150, 45, 160, 80, 180, 70);
  ctx.bezierCurveTo(200, 60, 210, 85, 235, 65);
  ctx.bezierCurveTo(255, 45, 275, 75, 290, 60);

  // Vòng lặp thắt nút
  ctx.bezierCurveTo(310, 40, 340, 45, 335, 75);
  ctx.bezierCurveTo(330, 100, 300, 90, 290, 75);

  // Nét gạch chân phóng khoáng dứt khoát
  ctx.moveTo(60, 105);
  ctx.bezierCurveTo(120, 115, 220, 110, 350, 90);
  ctx.stroke();

  // Dấu chấm kết thúc chữ ký
  ctx.fillStyle = '#1E3A8A';
  ctx.beginPath();
  ctx.arc(360, 88, 2.5, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/png');
}
