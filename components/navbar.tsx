'use client'

import { cn } from '@/lib/utils'
import { UserButton } from '@clerk/nextjs'
import { Menu, Sparkles } from 'lucide-react'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import React from 'react'
import { Button } from "@/components/ui/button"
import { ModeToggle } from '@/components/mode-toggle'
import MobileSidebar from '@/components/mobile-sidebar'
import { useProModal } from '@/hooks/use-pro-modal'


const font = Poppins({
    weight: "300",
    subsets: ["latin"]
})

interface NavbarProps {
    isPro: boolean;
  }
  

const Navbar = ( {isPro
}: NavbarProps) => {

    const proModal = useProModal();

  return (
    <div className="fixed w-full z-50 flex justify-between items-center py-2 px-4 border-b border-primary/10 bg-secondary h-16">
        <div className="flex items-center">
            <MobileSidebar isPro={isPro}/>
            <Link href="/">
                <h1 className={cn(
                    "hidden md:block text-xl md:text-4xl font-extralight text-primary",
                    font.className
                    )} >
                    aether.ai
                </h1>
            </Link>
        </div>
        <div className="flex items-center gap-x-3">
            {!isPro && (
            <Button onClick={proModal.onOpen} size="sm" variant="premium">
                Upgrade
                <Sparkles className="h-4 w-4 fill-white text-white ml-2" />
            </Button>
            )}
            <ModeToggle />
            <UserButton afterSignOutUrl='/'/>
        </div>
    </div>
  )
}

export default Navbar