import prismadb from "@/lib/prismadb"
import { Categories } from "@/components/categories"
import { Companions } from "@/components/companions"
import { SearchInput } from "@/components/search-input"
import { auth, redirectToSignIn, useUser } from "@clerk/nextjs";

interface RootPageProps {
  searchParams: {
    categoryId: string;
    name: string;
  };
};

const RootPage = async ({
  searchParams
}: RootPageProps) => {

  const { userId } = auth();

  if (!userId) {
      return redirectToSignIn()
  }
  
  const data = await prismadb.companion.findMany({
    where: {
      OR: [
        { userId: "user_2TWmfYTh97z043qxnsNmAAIZ9PH" }, // Companions created by admin user
        { userId }, // Companions created by the current user
      ],
      categoryId: searchParams.categoryId,
      name: {
        search: searchParams.name,
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      _count: {
        select: {
          messages: true,
        }
      }
    },
  });

  const categories = await prismadb.category.findMany();

  return (
    <div className="h-full p-4 space-y-2">
      <SearchInput />
      <Categories data={categories} />
      <Companions data={data} />
    </div>
  )
}

export default RootPage