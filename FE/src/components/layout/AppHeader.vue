<script setup>
import { Bell, UserRound } from 'lucide-vue-next'
import { Button, Avatar, Badge } from '@/components/ui'
</script>

<template>
  <header
    class="h-14 shrink-0 border-b border-border bg-card
           flex items-center justify-between px-6"
  >
    <div class="flex items-center gap-2.5">
      <img
        src="/icons.png"
        alt="ChaPyo"
        class="w-7 h-7 rounded-md object-cover"
      />
      <span class="font-semibold text-foreground tracking-tight text-[15px]">ChaPyo</span>
      <Badge variant="outline" class="ml-1 hidden sm:inline-flex">AI Travel Planner</Badge>
    </div>

    <nav class="flex items-center gap-1">
      <Button variant="ghost" size="icon" aria-label="알림">
        <Bell :size="16" />
      </Button>
      <Avatar size="sm" variant="muted" fallback="me">
        <UserRound :size="14" />
      </Avatar>
    </nav>
  </header>
</template>
