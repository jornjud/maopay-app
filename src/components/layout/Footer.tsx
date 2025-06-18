export const Footer = () => {
    // ดึงปีปัจจุบันมาแสดงอัตโนมัติ
    const currentYear = new Date().getFullYear();
  
    return (
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {currentYear} MAOPAY. All Rights Reserved.</p>
          <p className="text-sm text-gray-400 mt-2">
            สร้างสรรค์โดยเพื่อนเหมา แฟนปืนใหญ่พันธุ์แท้ 🔴⚪️
          </p>
        </div>
      </footer>
    );
  };
