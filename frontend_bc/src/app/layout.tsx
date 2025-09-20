import { ModernNavbar } from '@/components/layout/ModernNavbar';
// import { useAuth } from '@/features/auth/authContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  // const { user } = useAuth();

  // const getHeaderTitle = () => {
  //   if (!user) return "BackOffice";
  //   switch (user.role) {
  //     case 'chef_projet':
  //       return "Chef de Projet";
  //     case 'coordinateur':
  //       return "Coordinateur";
  //     case 'back_office':
  //       return "Back Office";
  //     default:
  //       return "BackOffice";
  //   }
  // };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <ModernNavbar />
      <div className="flex-1 flex flex-col w-full">
       
        <main className="flex-1 overflow-auto px-6 py-4">
          {children}
        </main>
      </div>
    </div>
  );
}